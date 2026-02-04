'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { getStripe } from '@/lib/stripe'
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

  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  if (!validStatuses.includes(status)) return { ok: false, error: 'Invalid status' }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true }
}
