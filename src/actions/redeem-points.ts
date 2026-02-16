'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { POINTS_REDEMPTION } from '@/lib/gamification'
import { randomBytes } from 'crypto'

export async function redeemPoints(pointsToRedeem: number) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { ok: false, error: 'Unauthorized' }
    }

    // Verify points amount is valid
    const discountCents = POINTS_REDEMPTION[pointsToRedeem as keyof typeof POINTS_REDEMPTION]
    if (!discountCents) {
        return { ok: false, error: 'Invalid redemption amount' }
    }

    // Get current user profile
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single()

    if (!profile || profile.total_xp < pointsToRedeem) {
        return { ok: false, error: 'Insufficient points' }
    }

    // Generate unique code
    const code = `REWARD-${randomBytes(3).toString('hex').toUpperCase()}`

    // Start transaction (simulated with individual calls as Supabase JS doesn't support transactions easily without RPC)
    // Ideally this should be an RPC, but for now we'll do it in sequence with checks

    // 1. Deduct points (create transaction)
    const { error: txError } = await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: -pointsToRedeem,
        reason: 'redemption',
        reference_id: null, // No specific reference for general redemption
    })

    if (txError) {
        return { ok: false, error: 'Failed to process redemption transaction' }
    }

    // 2. Update user profile total_xp
    const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ total_xp: profile.total_xp - pointsToRedeem })
        .eq('id', user.id)

    if (profileError) {
        // Critical error: transaction recorded but profile not updated.
        // In a real app, we'd need rigorous error handling/rollback here.
        console.error('CRITICAL: Failed to update user XP after redemption transaction', profileError)
        return { ok: false, error: 'Failed to update point balance' }
    }

    // 3. Create discount code
    const { error: discountError } = await supabase.from('discounts').insert({
        code,
        type: 'fixed',
        value_cents: discountCents,
        min_order_cents: 0, // No minimum for reward codes? Or maybe set one?
        max_uses: 1, // One-time use
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 30 days
    })

    if (discountError) {
        console.error('Error creating discount:', discountError)
        // Rollback would be needed here (refund points)
        return { ok: false, error: 'Failed to generate discount code' }
    }

    revalidatePath('/account')
    return { ok: true, code }
}
