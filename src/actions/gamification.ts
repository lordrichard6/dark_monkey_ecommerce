'use server'

import { createClient } from '@supabase/supabase-js'
import {
  processXpForPurchase,
  processXpForReferral,
  checkAndAwardAchievements,
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
  return processXpForPurchase(supabase, userId, orderId, totalCents)
}

/**
 * Award points to referrer when a referred user completes first purchase.
 * Called from Stripe webhook after order creation.
 */
export async function awardXpForReferral(referrerId: string): Promise<AwardXpResult> {
  const supabase = getAdminSupabase()
  if (!supabase) return { ok: false, error: 'Not configured' }
  return processXpForReferral(supabase, referrerId)
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
