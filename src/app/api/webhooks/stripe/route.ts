import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { sendOrderConfirmation } from '@/lib/resend'
import { awardXpForPurchase, awardXpForReferral } from '@/actions/gamification'
import {
  createOrder as createPrintfulOrder,
  getDefaultPrintFileUrl,
  isPrintfulConfigured,
} from '@/lib/printful'

// Use service role for webhook (bypasses RLS) - orders are created server-side
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Retrieve full session to get shipping address
  const fullSession = await stripe.checkout.sessions.retrieve(session.id)

  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  // Fetch cart items from DB (stored in abandoned_checkouts to avoid metadata limits)
  const { data: checkoutData } = await supabase
    .from('abandoned_checkouts')
    .select('cart_summary')
    .eq('stripe_session_id', session.id)
    .single()

  if (!checkoutData?.cart_summary || typeof checkoutData.cart_summary !== 'object') {
    return NextResponse.json(
      { error: 'Missing checkout data in DB' },
      { status: 400 }
    )
  }

  const cartSummary = checkoutData.cart_summary as {
    totalCents: number
    items: Array<{
      variantId: string
      productId: string
      quantity: string | number
      priceCents: number
      config?: Record<string, unknown>
    }>
  }

  const cartItems = cartSummary.items.map(item => ({
    ...item,
    quantity: Number(item.quantity) // Ensure number
  }))
  const totalCents = Number(cartSummary.totalCents)

  // Shipping address is in collected_information.shipping_details (newer API structure)
  const collectedShipping = (fullSession as any).collected_information?.shipping_details
  const shippingDetails = collectedShipping
  const address = shippingDetails?.address
  const shippingAddressJson = address
    ? {
      name: shippingDetails.name ?? '',
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

  console.log('[Webhook] Parsed shippingAddressJson:', JSON.stringify(shippingAddressJson, null, 2))

  const discountId = fullSession.metadata?.discount_id ?? null
  const discountCents = fullSession.metadata?.discount_cents
    ? parseInt(fullSession.metadata.discount_cents, 10)
    : 0

  const userId = fullSession.metadata?.user_id ?? null
  const guestEmail = fullSession.metadata?.guest_email ?? fullSession.customer_email ?? fullSession.customer_details?.email

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId || null,
      guest_email: guestEmail ?? null,
      status: 'paid',
      total_cents: totalCents,
      currency: 'CHF',
      stripe_session_id: fullSession.id,
      shipping_address_json: shippingAddressJson,
      discount_id: discountId || null,
      discount_cents: Number.isFinite(discountCents) ? discountCents : 0,
    })
    .select('id')
    .single()

  if (orderError) {
    console.error('Order creation error:', orderError)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }

  await supabase.from('abandoned_checkouts').delete().eq('stripe_session_id', fullSession.id)

  if (discountId) {
    const { data: disc } = await supabase.from('discounts').select('use_count').eq('id', discountId).single()
    if (disc) {
      await supabase.from('discounts').update({ use_count: (disc.use_count ?? 0) + 1 }).eq('id', discountId)
    }
  }

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    price_cents: item.priceCents,
    config: item.config ?? {},
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items creation error:', itemsError)
    return NextResponse.json(
      { error: 'Failed to create order items' },
      { status: 500 }
    )
  }

  // Decrement inventory for each purchased item
  for (const item of cartItems) {
    const { data: inventory } = await supabase
      .from('product_inventory')
      .select('quantity')
      .eq('variant_id', item.variantId)
      .single()

    if (inventory) {
      const newQuantity = Math.max(0, inventory.quantity - item.quantity)
      await supabase
        .from('product_inventory')
        .update({ quantity: newQuantity })
        .eq('variant_id', item.variantId)
    }
  }

  // Award XP for logged-in users
  if (userId) {
    const xpResult = await awardXpForPurchase(userId, order.id, totalCents)
    if (!xpResult.ok) {
      console.warn('XP award failed:', xpResult.error)
    }
    // Referral: if this user was referred and this is their first paid order, reward referrer
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id')
      .eq('referred_user_id', userId)
      .is('first_order_id', null)
      .maybeSingle()
    if (referral?.referrer_id) {
      await supabase.from('referrals').update({ first_order_id: order.id }).eq('id', referral.id)
      const refXp = await awardXpForReferral(referral.referrer_id)
      if (refXp.ok) {
        await supabase
          .from('referrals')
          .update({ referrer_xp_awarded_at: new Date().toISOString() })
          .eq('id', referral.id)
      } else {
        console.warn('Referral XP award failed:', refXp.error)
      }
    }
  }

  // Send order confirmation email (skipped if Resend not configured)
  const email = guestEmail ?? undefined
  if (email) {
    const emailResult = await sendOrderConfirmation({
      to: email,
      orderId: order.id,
      totalCents,
      currency: 'CHF',
      itemCount: cartItems.reduce((s, i) => s + i.quantity, 0),
    })
    if (!emailResult.ok) {
      console.warn('Order confirmation email not sent:', emailResult.error)
    }
  }

  // Printful fulfillment (skipped if not configured or no mappable items)
  if (isPrintfulConfigured() && shippingAddressJson?.address) {
    console.log('[Printful] Starting order creation for order:', order.id)
    const variantIds = cartItems.map((c) => c.variantId)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, printful_variant_id, printful_sync_variant_id')
      .in('id', variantIds)

    console.log('[Printful] Fetched variants:', JSON.stringify(variants, null, 2))

    const printfulItems: Array<{
      variant_id?: number
      sync_variant_id?: number
      quantity: number
      files?: { url: string }[]
      retail_price: string
    }> = []

    for (const item of cartItems) {
      const v = (variants ?? []).find((x) => x.id === item.variantId)
      if (!v) {
        console.warn('[Printful] Variant not found in DB:', item.variantId)
        continue
      }
      const syncId = (v as { printful_sync_variant_id?: number }).printful_sync_variant_id
      const catalogId = v.printful_variant_id
      console.log(`[Printful] Variant ${item.variantId}: syncId=${syncId}, catalogId=${catalogId}`)

      if (syncId != null) {
        printfulItems.push({
          sync_variant_id: syncId,
          quantity: item.quantity,
          // Do not send files for synced variants (uses Printful stored design)
          retail_price: (item.priceCents / 100).toFixed(2),
        })
      } else if (catalogId != null) {
        printfulItems.push({
          variant_id: catalogId,
          quantity: item.quantity,
          files: [{ url: getDefaultPrintFileUrl() }],
          retail_price: (item.priceCents / 100).toFixed(2),
        })
      } else {
        console.warn('[Printful] No Printful ID for variant:', item.variantId)
      }
    }

    console.log('[Printful] Items to send:', JSON.stringify(printfulItems, null, 2))

    if (printfulItems.length > 0) {
      const addr = shippingAddressJson.address
      const pfPayload = {
        recipient: {
          name: shippingAddressJson.name || 'Customer',
          address1: addr.line1,
          city: addr.city,
          state_code: addr.state || undefined,
          country_code: addr.country,
          zip: addr.postalCode,
          email: email ?? undefined,
        },
        items: printfulItems,
        external_id: order.id.replace(/-/g, ''), // Remove dashes to fit Printful's 32-char limit
      }
      console.log('[Printful] Sending order payload:', JSON.stringify(pfPayload, null, 2))

      const pfResult = await createPrintfulOrder(
        pfPayload,
        false // create as draft (do not auto-confirm) for testing
      )

      console.log('[Printful] Result:', JSON.stringify(pfResult, null, 2))

      if (pfResult.ok && pfResult.printfulOrderId) {
        await supabase
          .from('orders')
          .update({ printful_order_id: pfResult.printfulOrderId })
          .eq('id', order.id)
        console.log('[Printful] Order created successfully:', pfResult.printfulOrderId)
      } else {
        console.warn('Printful order failed:', pfResult.error)
      }
    } else if (cartItems.length > 0) {
      console.warn(
        'No Printful variant mapping for order items — run migration or printful_fetch_catalog'
      )
    }
  } else {
    console.log('[Printful] Skipped - not configured or no shipping address')
  }

  return NextResponse.json({ received: true, orderId: order.id })
}
