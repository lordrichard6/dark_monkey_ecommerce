'use server'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  getTierFromSpend,
  calculatePurchasePoints,
  POINTS_RULES,
} from '@/lib/gamification'

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
 * Award points to a user for a purchase and update spending + tier.
 * Called from webhook when order is paid (user_id present).
 */
export async function awardXpForPurchase(
  userId: string,
  orderId: string,
  totalCents: number
): Promise<AwardXpResult> {
  const supabase = getAdminSupabase()
  if (!supabase) return { ok: false, error: 'Not configured' }

  const points = calculatePurchasePoints(totalCents)

  // Get current profile data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_points, total_spent_cents, total_orders')
    .eq('id', userId)
    .single()

  const currentPoints = profile?.total_points ?? 0
  const currentSpent = profile?.total_spent_cents ?? 0
  const currentOrders = profile?.total_orders ?? 0

  const newPointsTotal = currentPoints + points
  const newSpentTotal = currentSpent + totalCents
  const newOrdersTotal = currentOrders + 1

  // Award points via transaction
  const { error: transactionError } = await supabase
    .from('points_transactions')
    .insert({
      user_id: userId,
      points: points,
      reason: 'purchase',
      metadata: { order_id: orderId, total_cents: totalCents },
    })

  if (transactionError) return { ok: false, error: transactionError.message }

  // Update profile with new totals and tier
  const newTier = getTierFromSpend(newSpentTotal)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      total_points: newPointsTotal,
      total_spent_cents: newSpentTotal,
      total_orders: newOrdersTotal,
      current_tier: newTier,
    })
    .eq('id', userId)

  if (profileError) return { ok: false, error: profileError.message }

  // Check and award achievements
  await checkAndAwardAchievements(supabase, userId)

  return { ok: true, xp: points, newTotal: newPointsTotal }
}

/**
 * Award points to referrer when a referred user completes first purchase.
 * Called from Stripe webhook after order creation.
 */
export async function awardXpForReferral(referrerId: string): Promise<AwardXpResult> {
  const supabase = getAdminSupabase()
  if (!supabase) return { ok: false, error: 'Not configured' }

  const points = POINTS_RULES.REFERRAL_PURCHASE

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_points, referral_count')
    .eq('id', referrerId)
    .single()

  const currentPoints = profile?.total_points ?? 0
  const currentReferrals = profile?.referral_count ?? 0
  const newPointsTotal = currentPoints + points
  const newReferralCount = currentReferrals + 1

  const { error: transactionError } = await supabase
    .from('points_transactions')
    .insert({
      user_id: referrerId,
      points: points,
      reason: 'referral_purchase',
      metadata: {},
    })

  if (transactionError) return { ok: false, error: transactionError.message }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      total_points: newPointsTotal,
      referral_count: newReferralCount,
    })
    .eq('id', referrerId)

  if (profileError) return { ok: false, error: profileError.message }

  await checkAndAwardAchievements(supabase, referrerId)

  return { ok: true, xp: points, newTotal: newPointsTotal }
}

async function checkAndAwardAchievements(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
) {
  // Fetch user stats
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_orders, total_spent_cents, review_count, current_tier, referral_count')
    .eq('id', userId)
    .single()

  if (!profile) return

  // Fetch all active achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('id, condition_type, condition_value, points_reward')
    .eq('is_active', true)

  if (!achievements?.length) return

  // Fetch already unlocked achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedIds = new Set((userAchievements ?? []).map((ua) => ua.achievement_id))

  // Check each achievement
  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue

    let shouldAward = false

    switch (achievement.condition_type) {
      case 'order_count':
        shouldAward = profile.total_orders >= achievement.condition_value
        break
      case 'review_count':
        shouldAward = profile.review_count >= achievement.condition_value
        break
      case 'total_spent':
        shouldAward = profile.total_spent_cents >= achievement.condition_value
        break
      case 'tier': {
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
        const userTierIndex = tierOrder.indexOf(profile.current_tier)
        shouldAward = userTierIndex >= achievement.condition_value
        break
      }
      case 'referral_count':
        shouldAward = profile.referral_count >= achievement.condition_value
        break
    }

    if (shouldAward) {
      // Award achievement
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      })

      // Award points for achievement
      if (achievement.points_reward > 0) {
        await supabase.from('points_transactions').insert({
          user_id: userId,
          points: achievement.points_reward,
          reason: 'achievement',
          metadata: { achievement_id: achievement.id },
        })

        // Update total points
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('total_points')
          .eq('id', userId)
          .single()

        if (currentProfile) {
          await supabase
            .from('user_profiles')
            .update({
              total_points: (currentProfile.total_points ?? 0) + achievement.points_reward,
            })
            .eq('id', userId)
        }
      }
    }
  }
}

/**
 * Check profile complete achievement when user updates profile.
 * Called from updateProfile action.
 */
export async function checkProfileCompleteBadge(userId: string): Promise<void> {
  const supabase = getAdminSupabase()
  if (!supabase) return

  await checkAndAwardAchievements(supabase, userId)
}
