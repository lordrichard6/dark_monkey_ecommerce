'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get purchase count for a product in the last 24 hours
 */
export async function getPurchaseCount(productId: string): Promise<number> {
    const supabase = await createClient()

    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { count } = await supabase
        .from('recent_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .gte('purchased_at', twentyFourHoursAgo.toISOString())

    return count || 0
}

/**
 * Get recent purchase activity for a product
 */
export async function getRecentPurchaseActivity(productId: string, limit = 10) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('recent_purchases')
        .select('id, location, purchased_at')
        .eq('product_id', productId)
        .order('purchased_at', { ascending: false })
        .limit(limit)

    return { data: data || [], error: error?.message }
}

/**
 * Manual cleanup of old purchases (for cron job or admin action)
 */
export async function cleanupOldPurchases(): Promise<{ deleted: number }> {
    const supabase = await createClient()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data, error } = await supabase
        .from('recent_purchases')
        .delete()
        .lt('purchased_at', sevenDaysAgo.toISOString())
        .select('id')

    if (error) {
        console.error('Cleanup error:', error)
        return { deleted: 0 }
    }

    return { deleted: data?.length || 0 }
}
