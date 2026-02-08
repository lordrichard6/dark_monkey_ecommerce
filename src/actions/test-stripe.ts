'use server'

import { getStripe } from '@/lib/stripe'

export async function testStripeConnection() {
    const stripe = getStripe()

    if (!stripe) {
        return {
            ok: false,
            error: 'Stripe client could not be initialized. Check STRIPE_SECRET_KEY.'
        }
    }

    try {
        console.log('[TestStripe] Attempting to list payment intents...')
        // Perform a lightweight API call
        const result = await stripe.paymentIntents.list({ limit: 1 })

        return {
            ok: true,
            message: 'Connection successful',
            data: `Retrieved ${result.data.length} payment intents.`,
            keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
        }
    } catch (err: any) {
        console.error('[TestStripe] Connection failed:', err)
        return {
            ok: false,
            error: err.message,
            code: err.code,
            type: err.type,
            fullError: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        }
    }
}
