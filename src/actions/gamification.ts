'use server'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getTierForXp, xpForPurchase, XP_REFERRAL_FIRST_PURCHASE } from '@/lib/gamification'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export type AwardXpResult =
  | { ok: true; xp: number; newTotal: number }
  | { ok: false; error: string }

/**
 * Award XP to a user and update total_xp + tier.
 * Called from webhook when order is paid (user_id present).
 */
export async function awardXpForPurchase(
  userId: string,
  orderId: string,
  totalCents: number
): Promise<AwardXpResult> {
  const supabase = getAdminSupabase()
  if (!supabase) return { ok: false, error: 'Not configured' }

  const xp = xpForPurchase(totalCents)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_xp')
    .eq('id', userId)
    .single()

  const currentXp = profile?.total_xp ?? 0
  const newTotal = currentXp + xp

  const { error: eventError } = await supabase.from('user_xp_events').insert({
    user_id: userId,
    event_type: 'purchase',
    amount: xp,
    metadata: { order_id: orderId, total_cents: totalCents },
  })

  if (eventError) return { ok: false, error: eventError.message }

  const newTier = getTierForXp(newTotal)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ total_xp: newTotal, tier: newTier })
    .eq('id', userId)

  if (profileError) return { ok: false, error: profileError.message }

  await checkAndAwardBadges(supabase, userId, newTotal)

  return { ok: true, xp, newTotal }
}

/**
 * Award XP to referrer when a referred user completes first purchase.
 * Called from Stripe webhook after order creation.
 */
export async function awardXpForReferral(referrerId: string): Promise<AwardXpResult> {
  const supabase = getAdminSupabase()
  if (!supabase) return { ok: false, error: 'Not configured' }

  const xp = XP_REFERRAL_FIRST_PURCHASE

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_xp')
    .eq('id', referrerId)
    .single()

  const currentXp = profile?.total_xp ?? 0
  const newTotal = currentXp + xp

  const { error: eventError } = await supabase.from('user_xp_events').insert({
    user_id: referrerId,
    event_type: 'referral',
    amount: xp,
    metadata: {},
  })

  if (eventError) return { ok: false, error: eventError.message }

  const newTier = getTierForXp(newTotal)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ total_xp: newTotal, tier: newTier })
    .eq('id', referrerId)

  if (profileError) return { ok: false, error: profileError.message }

  await checkAndAwardBadges(supabase, referrerId, newTotal)

  return { ok: true, xp, newTotal }
}

async function checkAndAwardBadges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  _totalXp: number
) {
  const { data: badges } = await supabase.from('badges').select('id, code')
  if (!badges?.length) return

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)
  const owned = new Set((userBadges ?? []).map((b) => b.badge_id))

  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
  const orderCount = orders?.length ?? 0

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', userId)
    .single()
  const hasDisplayName = !!profile?.display_name?.trim()

  for (const badge of badges) {
    if (owned.has(badge.id)) continue

    let shouldAward = false
    if (badge.code === 'first_purchase' && orderCount >= 1) shouldAward = true
    if (badge.code === 'five_orders' && orderCount >= 5) shouldAward = true
    if (badge.code === 'ten_orders' && orderCount >= 10) shouldAward = true
    if (badge.code === 'profile_complete' && hasDisplayName) shouldAward = true

    if (shouldAward) {
      await supabase.from('user_badges').upsert(
        { user_id: userId, badge_id: badge.id },
        { onConflict: 'user_id,badge_id' }
      )
    }
  }
}

/**
 * Award profile_complete badge when user updates profile.
 * Called from updateProfile action.
 */
export async function checkProfileCompleteBadge(userId: string): Promise<void> {
  const supabase = getAdminSupabase()
  if (!supabase) return

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', userId)
    .single()

  if (!profile?.display_name?.trim()) return

  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('code', 'profile_complete')
    .single()

  if (!badge) return

  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badge.id)
    .single()

  if (existing) return

  await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: badge.id,
  })
}
