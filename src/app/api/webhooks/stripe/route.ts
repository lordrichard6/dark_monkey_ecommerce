import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { processSuccessfulCheckout } from '@/lib/orders'

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

  let eventBytes: any
  try {
    eventBytes = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (eventBytes.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = eventBytes.data.object as any

  try {
    const result = await processSuccessfulCheckout(session.id)
    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      alreadyProcessed: result.alreadyProcessed
    })
  } catch (err: any) {
    console.error('[Stripe Webhook] Processing failed:', err.message)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
