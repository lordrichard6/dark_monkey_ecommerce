
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * Claims any "guest" orders (user_id is null) that match the user's email.
 * This should be called after a user signs up or logs in.
 */
export async function claimGuestOrdersForUser(userId: string, email: string) {
    if (!userId || !email) return { claimed: 0 }

    const supabase = getAdminClient()
    if (!supabase) {
        console.error('[ClaimOrders] Admin client not available')
        return { claimed: 0, error: 'Database configuration error' }
    }

    try {
        // Find and update orphan orders
        // We check both guest_email and user_email to be thorough
        const { data, error } = await supabase
            .from('orders')
            .update({ user_id: userId })
            .or(`guest_email.eq.${email},user_email.eq.${email}`)
            .is('user_id', null)
            .select('id')

        if (error) {
            console.error('[ClaimOrders] Error claiming orders:', error)
            return { claimed: 0, error: error.message }
        }

        const count = data?.length || 0
        if (count > 0) {
            console.log(`[ClaimOrders] Successfully linked ${count} guest orders to user ${userId} (${email})`)
        }

        return { claimed: count }

    } catch (err) {
        console.error('[ClaimOrders] Unexpected error:', err)
        return { claimed: 0, error: 'Unexpected error' }
    }
}
