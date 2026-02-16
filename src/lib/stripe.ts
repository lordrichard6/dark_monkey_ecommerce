import Stripe from 'stripe'

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  return new Stripe(key, {
    timeout: 30000,
    maxNetworkRetries: 3,
  })
}

export async function retrieveSession(id: string) {
  const stripe = getStripe()
  if (!stripe) return null
  try {
    return await stripe.checkout.sessions.retrieve(id)
  } catch (error) {
    console.error('[Stripe] Failed to retrieve session:', error)
    return null
  }
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
}
