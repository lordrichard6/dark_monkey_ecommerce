'use server'

import { checkOrderExists } from '@/lib/orders'

export async function checkOrderStatus(sessionId: string) {
    try {
        const order = await checkOrderExists(sessionId)
        if (order) {
            return { ok: true, order }
        }
        return { ok: false }
    } catch (error) {
        console.error('Error checking order status:', error)
        return { ok: false }
    }
}
