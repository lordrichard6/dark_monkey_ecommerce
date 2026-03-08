'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { getStripe } from '@/lib/stripe'
import {
  createOrder as createPrintfulOrder,
  getDefaultPrintFileUrl,
  isPrintfulConfigured,
} from '@/lib/printful'
import type { PrintfulOrderItem } from '@/lib/printful/types'
import { revalidatePath } from 'next/cache'
import type { Stripe } from 'stripe'

export type RefundOrderResult = { ok: true } | { ok: false; error: string }

/**
 * Initiate a full refund in Stripe and set order status to 'refunded'.
 * Requires order to have stripe_session_id and status paid/processing/shipped/delivered.
 */
export async function refundOrder(orderId: string): Promise<RefundOrderResult> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const stripe = getStripe()
  if (!stripe) return { ok: false, error: 'Stripe not configured' }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, stripe_session_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { ok: false, error: 'Order not found' }
  if (!order.stripe_session_id) return { ok: false, error: 'Order has no Stripe payment' }

  const allowedStatuses = ['paid', 'processing', 'shipped', 'delivered']
  if (!allowedStatuses.includes(order.status)) {
    return { ok: false, error: `Cannot refund order with status "${order.status}"` }
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    return { ok: false, error: `Failed to load session: ${msg}` }
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as { id?: string } | null)?.id
  if (!paymentIntentId) return { ok: false, error: 'No payment intent on session' }

  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe refund failed'
    return { ok: false, error: msg }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', orderId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const validStatuses = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]
  if (!validStatuses.includes(status)) return { ok: false, error: 'Invalid status' }

  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true }
}

/**
 * Retry Printful fulfillment for an order that failed to create a Printful order.
 * Only works for orders where printful_order_id IS NULL.
 */
export async function retryPrintfulFulfillment(
  orderId: string
): Promise<{ ok: true; printfulOrderId: number } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  if (!isPrintfulConfigured()) return { ok: false, error: 'Printful not configured' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  // Fetch order with items
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(
      `
      id,
      printful_order_id,
      shipping_address_json,
      guest_email,
      user_id,
      order_items (
        variant_id,
        quantity,
        price_cents
      )
    `
    )
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { ok: false, error: 'Order not found' }
  if (order.printful_order_id) return { ok: false, error: 'Printful order already exists' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr = (order.shipping_address_json as any)?.address
  if (!addr) return { ok: false, error: 'No shipping address on order' }

  // Fetch Printful variant IDs
  const variantIds = order.order_items.map((i: { variant_id: string }) => i.variant_id)
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, printful_variant_id, printful_sync_variant_id')
    .in('id', variantIds)

  const printfulItems: PrintfulOrderItem[] = []
  for (const item of order.order_items) {
    const v = (variants ?? []).find((x) => x.id === item.variant_id)
    if (!v) continue
    if (v.printful_sync_variant_id != null) {
      printfulItems.push({
        sync_variant_id: v.printful_sync_variant_id,
        quantity: item.quantity,
        retail_price: (item.price_cents / 100).toFixed(2),
      })
    } else if (v.printful_variant_id != null) {
      printfulItems.push({
        variant_id: v.printful_variant_id,
        quantity: item.quantity,
        files: [{ url: getDefaultPrintFileUrl() }],
        retail_price: (item.price_cents / 100).toFixed(2),
      })
    }
  }

  if (printfulItems.length === 0) return { ok: false, error: 'No printable items in order' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shippingJson = order.shipping_address_json as any
  const pfResult = await createPrintfulOrder({
    recipient: {
      name: shippingJson?.name || 'Customer',
      address1: addr.line1,
      city: addr.city,
      state_code: addr.state || undefined,
      country_code: addr.country,
      zip: addr.postalCode,
    },
    items: printfulItems,
    external_id: order.id.replace(/-/g, ''),
  })

  if (!pfResult.ok || !pfResult.printfulOrderId) {
    return { ok: false, error: pfResult.error ?? 'Printful API error' }
  }

  await supabase
    .from('orders')
    .update({ printful_order_id: pfResult.printfulOrderId })
    .eq('id', orderId)

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, printfulOrderId: pfResult.printfulOrderId }
}
