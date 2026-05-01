import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { processSuccessfulCheckout } from '@/lib/orders'
import { markChangeRequestPaid } from '@/actions/custom-products'
import { claimWebhookEvent } from '@/lib/webhook-dedup'

// Allow up to 60s — Stripe requires a response within 30s, and we need time for
// Stripe API + DB writes + Printful API calls. Default Vercel timeout (10s) is too short.
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let eventBytes: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    eventBytes = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (eventBytes.type !== 'checkout.session.completed') {
    console.log(`[Stripe Webhook] Ignoring event type: ${eventBytes.type}`)
    return NextResponse.json({ received: true })
  }

  // Idempotency — Stripe retries on network errors / 5xx. Without this,
  // a retried checkout could create a duplicate order or double-charge a
  // custom change request. processSuccessfulCheckout has its own
  // order-level dedup, but markChangeRequestPaid does not, and defense-in-
  // depth at the webhook level makes both paths safe.
  const claim = await claimWebhookEvent('stripe', eventBytes.id, eventBytes.type)
  if (claim.alreadyProcessed) {
    console.log(`[Stripe Webhook] Duplicate delivery — event ${eventBytes.id} already processed`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  const session = eventBytes.data.object as {
    id: string
    status: string
    payment_status: string
    metadata?: Record<string, string>
  }
  // Log only non-PII fields — never log shipping_details (customer name/address)
  console.log(
    `[Stripe Webhook] checkout.session.completed — session: ${session.id}, status: ${session.status}, payment: ${session.payment_status}`
  )

  // Custom change request payment — handled separately from normal orders
  if (session.metadata?.type === 'custom_change_request') {
    try {
      await markChangeRequestPaid(session.id)
      return NextResponse.json({ received: true, type: 'custom_change_request' })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Stripe Webhook] Custom change request processing failed:', errMsg)
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }
  }

  try {
    const result = await processSuccessfulCheckout(session.id)
    console.log(
      `[Stripe Webhook] Processing complete — order: ${result.orderId}, alreadyProcessed: ${result.alreadyProcessed}`
    )
    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      alreadyProcessed: result.alreadyProcessed,
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe Webhook] Processing failed:', errMsg)
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
