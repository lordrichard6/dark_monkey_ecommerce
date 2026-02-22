import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { processSuccessfulCheckout } from '@/lib/orders'

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

  let eventBytes: any
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

  const session = eventBytes.data.object as any
  console.log(
    `[Stripe Webhook] checkout.session.completed received. Session: ${session.id}, Status: ${session.status}, Payment: ${session.payment_status}, Shipping: ${JSON.stringify(session.shipping_details)}`
  )

  try {
    const result = await processSuccessfulCheckout(session.id)
    console.log(
      `[Stripe Webhook] Processing complete. Order: ${result.orderId}, AlreadyProcessed: ${result.alreadyProcessed}`
    )
    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      alreadyProcessed: result.alreadyProcessed,
    })
  } catch (err: any) {
    console.error('[Stripe Webhook] Processing failed:', err.message)
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
