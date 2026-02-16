'use server'

import { processSuccessfulCheckout } from '@/lib/orders'
import { revalidatePath } from 'next/cache'

export async function syncStripeOrder(sessionId: string) {
    if (!sessionId) {
        return { ok: false, error: 'Missing session ID' }
    }

    try {
        console.log(`[Action] Manually syncing order for session: ${sessionId}`)
        const result = await processSuccessfulCheckout(sessionId)

        // Revalidate relevant pages
        revalidatePath('/account/orders')

        return {
            ok: true,
            orderId: result.orderId,
            alreadyProcessed: result.alreadyProcessed
        }
    } catch (error: any) {
        console.error('[Action] Order sync failed:', error.message)
        return { ok: false, error: error.message }
    }
}
