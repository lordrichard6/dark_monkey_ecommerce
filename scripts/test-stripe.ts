import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testStripe() {
    const key = process.env.STRIPE_SECRET_KEY
    console.log('Using key:', key ? `${key.substring(0, 7)}...` : 'MISSING')

    if (!key) {
        console.error('Error: STRIPE_SECRET_KEY is missing from .env.local')
        return
    }

    const stripe = new Stripe(key, {
        timeout: 30000,
        maxNetworkRetries: 3,
    })

    try {
        console.log('Attempting to fetch Stripe account info...')
        const account = await stripe.accounts.retrieve()
        console.log('Success! Connected to account:', account.id)
        console.log('Currency:', account.default_currency)
    } catch (err: any) {
        console.error('Stripe connection failed!')
        console.error('Error Type:', err.type)
        console.error('Error Message:', err.message)
        if (err.raw) {
            console.error('Raw Error:', JSON.stringify(err.raw, null, 2))
        }
    }
}

testStripe()
