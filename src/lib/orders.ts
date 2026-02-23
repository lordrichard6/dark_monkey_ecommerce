// import { createClient } from '@supabase/supabase-js'
// import Stripe from 'stripe'
import { getStripe } from './stripe'
import { sendOrderConfirmation } from './resend'
import { processXpForPurchase, processXpForReferral } from './gamification'
import {
  createOrder as createPrintfulOrder,
  getDefaultPrintFileUrl,
  isPrintfulConfigured,
} from './printful'
import type { PrintfulOrderItem } from './printful/types'
import { revalidatePath } from 'next/cache'

import { getAdminClient } from './supabase/admin'

/**
 * Processes a successful Stripe checkout session.
 * Created to be shared between the Stripe Webhook and a manual "Sync" action on the success page.
 */
export async function processSuccessfulCheckout(sessionId: string) {
  console.log(`[OrderProcess] >>> STARTING PROCESSING for session: ${sessionId}`)

  const stripe = getStripe()
  if (!stripe) {
    console.error('[OrderProcess] ERROR: Stripe not configured')
    throw new Error('Stripe not configured')
  }

  const supabase = getAdminClient()
  if (!supabase) {
    console.error(
      '[OrderProcess] CRITICAL: Admin Supabase client not configured (Missing service role key?)'
    )
    throw new Error('Database admin access not configured')
  }

  // 1. Check if order already exists
  console.log(`[OrderProcess] Step 1: Checking for existing order for session: ${sessionId}`)
  const { data: existingOrder, error: checkError } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (checkError) {
    console.error('[OrderProcess] ERROR checking existing order:', checkError)
  }

  if (existingOrder) {
    console.log(
      `[OrderProcess] ! Order already processed for session: ${sessionId} (Order ID: ${existingOrder.id})`
    )
    return { ok: true, orderId: existingOrder.id, alreadyProcessed: true }
  }

  // 2. Retrieve full session details
  console.log('[OrderProcess] Step 2: Retrieving session from Stripe...')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullSession: any = await stripe.checkout.sessions.retrieve(sessionId)
  console.log(
    `[OrderProcess] Stripe session retrieved. Status: ${fullSession.status}, Payment status: ${fullSession.payment_status}`
  )

  // Only process fully-paid sessions. 'open' means the customer hasn't paid yet —
  // processing it would create an order with no shipping address and no Printful fulfillment.
  if (fullSession.status !== 'complete') {
    console.warn(`[OrderProcess] ! Session status is ${fullSession.status}, aborting.`)
    throw new Error(
      `Session not complete (status: ${fullSession.status}). Will retry when payment is confirmed.`
    )
  }

  // 3. Fetch cart items from abandoned_checkouts
  console.log('[OrderProcess] Step 3: Recovering cart from abandoned_checkouts...')
  const { data: checkoutData, error: abandonedError } = await supabase
    .from('abandoned_checkouts')
    .select('cart_summary')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (abandonedError) {
    console.error('[OrderProcess] ERROR fetching abandoned_checkout:', abandonedError)
  }

  if (!checkoutData?.cart_summary) {
    console.error(
      `[OrderProcess] CRITICAL: Missing abandoned_checkout record for session: ${sessionId}. Cart recovery impossible.`
    )
    // Log what we DO have for debugging
    const { data: allAbandoned } = await supabase
      .from('abandoned_checkouts')
      .select('stripe_session_id')
      .limit(5)
    console.log(
      '[OrderProcess] Recent abandoned checkouts in DB:',
      allAbandoned?.map((a) => a.stripe_session_id)
    )
    throw new Error('Missing abandoned_checkout record (required for cart recovery)')
  }

  console.log('[OrderProcess] Checkout data recovered successfully')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cartSummary = checkoutData.cart_summary as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cartItems = (cartSummary.items || []).map((item: any) => ({
    ...item,
    quantity: Number(item.quantity),
  }))
  const totalCents = Number(cartSummary.totalCents || fullSession.metadata?.totalCents || 0)

  // 4. Extract shipping details
  // Stripe may return the address under shipping_details (when collect_shipping_address=true
  // with a separate shipping step) OR under customer_details when the address is collected
  // as part of the billing/customer form. We check both.
  const shippingDetails = fullSession.shipping_details || fullSession.customer_details
  const address = shippingDetails?.address
  const shippingAddressJson = address
    ? {
        name: shippingDetails.name ?? fullSession.customer_details?.name ?? '',
        address: {
          line1: address.line1 ?? '',
          line2: address.line2 ?? '',
          city: address.city ?? '',
          postalCode: address.postal_code ?? '',
          country: address.country ?? '',
          state: address.state ?? '',
        },
      }
    : null

  const discountId = fullSession.metadata?.discount_id ?? null
  const discountCents = fullSession.metadata?.discount_cents
    ? parseInt(fullSession.metadata.discount_cents, 10)
    : 0

  const userId = fullSession.metadata?.user_id ?? null
  const guestEmail =
    fullSession.metadata?.guest_email ||
    fullSession.customer_email ||
    fullSession.customer_details?.email

  // Derive the actual charged currency and amount from Stripe (source of truth).
  // fullSession.amount_total is in the currency's smallest unit (e.g. cents).
  // fullSession.currency is the ISO 4217 code lowercased (e.g. 'chf', 'eur', 'usd').
  const stripeCurrency = ((fullSession.currency as string) ?? 'chf').toUpperCase()
  const stripeAmountTotal =
    typeof fullSession.amount_total === 'number' ? fullSession.amount_total : totalCents // CHF fallback from cart summary

  // 5. Create Order & Order Items (CRITICAL PATH)
  // We do this BEFORE slow external calls so the client finds the order instantly.
  console.log(`[OrderProcess] Creating order: ${stripeAmountTotal} ${stripeCurrency}`)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId || null,
      guest_email: guestEmail ?? null,
      status: 'paid',
      total_cents: stripeAmountTotal,
      currency: stripeCurrency,
      stripe_session_id: sessionId,
      shipping_address_json: shippingAddressJson,
      discount_id: discountId || null,
      discount_cents: Number.isFinite(discountCents) ? discountCents : 0,
    })
    .select('id, guest_email')
    .single()

  if (orderError) {
    console.error('[OrderProcess] Order creation failed:', orderError)
    throw orderError
  }

  console.log(`[OrderProcess] Order created: ${order.id}`)

  // Increment discount use_count so max_uses limits are enforced correctly.
  // This must happen after order creation to ensure we only count completed orders.
  if (discountId) {
    const { error: discountErr } = await supabase.rpc('increment_discount_use_count', {
      p_discount_id: discountId,
    })
    if (discountErr) {
      // Non-fatal: log and continue. A slightly wrong use_count is better than losing an order.
      console.error('[OrderProcess] Failed to increment discount use_count:', discountErr.message)
    } else {
      console.log(`[OrderProcess] Discount use_count incremented for: ${discountId}`)
    }
  }

  // Cleanup & Item Insertion
  await supabase.from('abandoned_checkouts').delete().eq('stripe_session_id', sessionId)

  const orderItems = cartItems.map(
    (item: {
      variantId: string
      quantity: number
      priceCents: number
      config?: Record<string, unknown>
    }) => ({
      order_id: order.id,
      variant_id: item.variantId,
      quantity: item.quantity,
      price_cents: item.priceCents,
      config: item.config ?? {},
    })
  )

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) {
    console.error('[OrderProcess] Order items creation failed:', itemsError)
  }

  // 6. Non-Blocking Fulfillment Block (Parallel)
  // We use Promise.allSettled to ensure one slow API (e.g. Resend) doesn't stop others (e.g. Printful)
  // and they all run concurrently.
  console.log(
    '[OrderProcess] Starting parallel fulfillment block (Email, Printful, Gamification)...'
  )

  const fulfillmentPromises: Promise<unknown>[] = []

  // A. Confirmation Email
  const email = guestEmail ?? order.guest_email ?? undefined
  if (email) {
    const registerUrl =
      !userId && email
        ? `${process.env.NEXT_PUBLIC_APP_URL}/login?mode=signup&email=${encodeURIComponent(email)}`
        : undefined

    fulfillmentPromises.push(
      sendOrderConfirmation({
        to: email,
        orderId: order.id,
        totalCents: stripeAmountTotal,
        currency: stripeCurrency,
        itemCount: cartItems.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
        registerUrl,
      }).catch((err) => console.error('[OrderProcess] Email failed:', err))
    )
  }

  // B. Printful Fulfillment
  const isPfConfigured = isPrintfulConfigured()
  console.log(`[OrderProcess] Printful configured: ${isPfConfigured}`)

  if (isPfConfigured && shippingAddressJson?.address) {
    const pfJob = (async () => {
      const variantIds = cartItems.map((c: { variantId: string }) => c.variantId)
      console.log(`[OrderProcess] Fetching Printful IDs for ${variantIds.length} items...`)

      const { data: variants, error: vError } = await supabase
        .from('product_variants')
        .select('id, printful_variant_id, printful_sync_variant_id')
        .in('id', variantIds)

      if (vError) {
        console.error('[OrderProcess] DB Error fetching variants:', vError)
      }

      const printfulItems: PrintfulOrderItem[] = []
      for (const item of cartItems) {
        const v = (variants ?? []).find((x) => x.id === item.variantId)
        if (!v) {
          console.log(`[OrderProcess] ! Variant not found in DB for item: ${item.variantId}`)
          continue
        }

        if (v.printful_sync_variant_id != null) {
          printfulItems.push({
            sync_variant_id: v.printful_sync_variant_id,
            quantity: item.quantity,
            retail_price: (item.priceCents / 100).toFixed(2),
          })
        } else if (v.printful_variant_id != null) {
          const logoUrl = getDefaultPrintFileUrl()
          printfulItems.push({
            variant_id: v.printful_variant_id,
            quantity: item.quantity,
            files: [{ url: logoUrl }],
            retail_price: (item.priceCents / 100).toFixed(2),
          })
        } else {
          console.log(
            `[OrderProcess] ! Variant ${item.variantId} has no Printful IDs (Sync or Catalog)`
          )
        }
      }

      console.log(`[OrderProcess] Mapping complete. Items to send: ${printfulItems.length}`)

      if (printfulItems.length > 0) {
        console.log('[OrderProcess] Calling Printful API...')
        // Orders are created as draft intentionally — manual review required
        // before Printful queues them for production.
        const pfResult = await createPrintfulOrder({
          recipient: {
            name: shippingAddressJson.name || 'Customer',
            address1: shippingAddressJson.address.line1,
            city: shippingAddressJson.address.city,
            state_code: shippingAddressJson.address.state || undefined,
            country_code: shippingAddressJson.address.country,
            zip: shippingAddressJson.address.postalCode,
            email: email ?? undefined,
          },
          items: printfulItems,
          external_id: order.id.replace(/-/g, ''),
        })

        console.log('[OrderProcess] Printful API Result:', JSON.stringify(pfResult, null, 2))

        if (pfResult.ok && pfResult.printfulOrderId) {
          const { error: updErr } = await supabase
            .from('orders')
            .update({ printful_order_id: pfResult.printfulOrderId })
            .eq('id', order.id)
          if (updErr) console.error('[OrderProcess] DB Error updating order with PF ID:', updErr)
          else
            console.log(
              `[OrderProcess] SUCCESS: Order updated with Printful ID: ${pfResult.printfulOrderId}`
            )
        }
      } else {
        console.log('[OrderProcess] ! Skipping Printful API: No valid items found.')
      }
    })()
    fulfillmentPromises.push(
      pfJob.catch((err) => console.error('[OrderProcess] Printful failed:', err))
    )
  } else {
    console.log(
      `[OrderProcess] Skipping Printful block. Configured: ${isPfConfigured}, Address: ${!!shippingAddressJson?.address}`
    )
  }

  // C. Gamification & XP
  if (userId) {
    const gamifyJob = (async () => {
      await processXpForPurchase(supabase, userId, order.id, totalCents)
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referred_user_id', userId)
        .is('first_order_id', null)
        .maybeSingle()
      if (referral?.referrer_id) {
        await supabase.from('referrals').update({ first_order_id: order.id }).eq('id', referral.id)
        await processXpForReferral(supabase, referral.referrer_id)
        await supabase
          .from('referrals')
          .update({ referrer_xp_awarded_at: new Date().toISOString() })
          .eq('id', referral.id)
      }
    })()
    fulfillmentPromises.push(
      gamifyJob.catch((err) => console.error('[OrderProcess] Gamification failed:', err))
    )
  }

  // D. Inventory & Social Proof (Essential but can be parallel)
  const postProcessJob = (async () => {
    const productSlugsToRevalidate = new Set<string>()
    const location =
      shippingAddressJson?.address?.city && shippingAddressJson?.address?.country
        ? `${shippingAddressJson.address.city}, ${shippingAddressJson.address.country}`
        : shippingAddressJson?.address?.country || null

    for (const item of cartItems) {
      const { data: inv } = await supabase
        .from('product_inventory')
        .select('quantity')
        .eq('variant_id', item.variantId)
        .single()
      if (inv) {
        await supabase
          .from('product_inventory')
          .update({ quantity: Math.max(0, inv.quantity - item.quantity) })
          .eq('variant_id', item.variantId)
      }
      await supabase.from('recent_purchases').insert({
        product_id: item.productId,
        variant_id: item.variantId,
        location,
      })
      const { data: p } = await supabase
        .from('products')
        .select('slug')
        .eq('id', item.productId)
        .single()
      if (p?.slug) productSlugsToRevalidate.add(p.slug)
    }
    for (const slug of productSlugsToRevalidate) {
      try {
        revalidatePath(`/products/${slug}`)
      } catch (_) {}
    }
  })()
  fulfillmentPromises.push(
    postProcessJob.catch((err) => console.error('[OrderProcess] Post-processing failed:', err))
  )

  // Final Sync Point
  // We wait for all SETTLED promises before returning, ensuring background tasks started correctly
  // but without blocking sequentially.
  await Promise.allSettled(fulfillmentPromises)

  console.log('[OrderProcess] Synchronization complete successfully')
  return { ok: true, orderId: order.id }
}

// Helper for simple existence check without heavy processing (used by polling)
export async function checkOrderExists(sessionId: string) {
  const supabase = getAdminClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('orders')
    .select('id, status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  return data
}
