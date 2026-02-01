import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { sendOrderConfirmation } from '@/lib/resend'
import { awardXpForPurchase } from '@/actions/gamification'
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
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  const cartItemsJson = session.metadata?.cartItems
  const totalCentsStr = session.metadata?.totalCents
  const userId = session.metadata?.user_id ?? null
  const guestEmail = session.metadata?.guest_email ?? session.customer_email ?? session.customer_details?.email

  if (!cartItemsJson || !totalCentsStr) {
    return NextResponse.json(
      { error: 'Missing metadata' },
      { status: 400 }
    )
  }

  const cartItems = JSON.parse(cartItemsJson) as Array<{
    variantId: string
    productId: string
    quantity: number
    priceCents: number
    config?: Record<string, unknown>
  }>
  const totalCents = parseInt(totalCentsStr, 10)

  // Shipping address from Stripe Checkout Session
  const sessionWithShipping = session as Stripe.Checkout.Session & {
    shipping_details?: {
      name?: string
      address?: {
        line1?: string
        line2?: string
        city?: string
        postal_code?: string
        country?: string
      }
    }
  }
  const shippingDetails = sessionWithShipping.shipping_details
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
          state: (address as { state?: string }).state ?? '',
        },
      }
    : null

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId || null,
      guest_email: guestEmail ?? null,
      status: 'paid',
      total_cents: totalCents,
      currency: 'CHF',
      stripe_session_id: session.id,
      shipping_address_json: shippingAddressJson,
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

  // Award XP for logged-in users
  if (userId) {
    const xpResult = await awardXpForPurchase(userId, order.id, totalCents)
    if (!xpResult.ok) {
      console.warn('XP award failed:', xpResult.error)
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
    const variantIds = cartItems.map((c) => c.variantId)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, printful_variant_id, printful_sync_variant_id')
      .in('id', variantIds)

    const printfulItems: Array<{
      variant_id?: number
      sync_variant_id?: number
      quantity: number
      files: { url: string }[]
      retail_price: string
    }> = []

    for (const item of cartItems) {
      const v = (variants ?? []).find((x) => x.id === item.variantId)
      if (!v) continue
      const syncId = (v as { printful_sync_variant_id?: number }).printful_sync_variant_id
      const catalogId = v.printful_variant_id
      if (syncId != null) {
        printfulItems.push({
          sync_variant_id: syncId,
          quantity: item.quantity,
          files: [{ url: getDefaultPrintFileUrl() }],
          retail_price: (item.priceCents / 100).toFixed(2),
        })
      } else if (catalogId != null) {
        printfulItems.push({
          variant_id: catalogId,
          quantity: item.quantity,
          files: [{ url: getDefaultPrintFileUrl() }],
          retail_price: (item.priceCents / 100).toFixed(2),
        })
      }
    }

    if (printfulItems.length > 0) {
      const addr = shippingAddressJson.address
      const pfResult = await createPrintfulOrder(
        {
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
          external_id: order.id,
        },
        true
      )

      if (pfResult.ok && pfResult.printfulOrderId) {
        await supabase
          .from('orders')
          .update({ printful_order_id: pfResult.printfulOrderId })
          .eq('id', order.id)
      } else {
        console.warn('Printful order failed:', pfResult.error)
      }
    } else if (cartItems.length > 0) {
      console.warn(
        'No Printful variant mapping for order items — run migration or printful_fetch_catalog'
      )
    }
  }

  return NextResponse.json({ received: true, orderId: order.id })
}
