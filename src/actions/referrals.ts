'use server'

import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

const REFERRAL_CODE_LENGTH = 10

function generateCode(): string {
  return randomBytes(REFERRAL_CODE_LENGTH)
    .toString('base64url')
    .replace(/[-_]/g, '')
    .slice(0, REFERRAL_CODE_LENGTH)
}

export type GetOrCreateReferralCodeResult =
  | { ok: true; code: string; link: string }
  | { ok: false; error: string }

/**
 * Get or create the current user's referral code. Returns the code and full referral link.
 */
export async function getOrCreateReferralCode(): Promise<GetOrCreateReferralCodeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('user_referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .single()

  if (existing?.code) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const link = baseUrl ? `${baseUrl}?ref=${encodeURIComponent(existing.code)}` : `?ref=${encodeURIComponent(existing.code)}`
    return { ok: true, code: existing.code, link }
  }

  let code = generateCode()
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from('user_referral_codes').insert({
      user_id: user.id,
      code,
    })
    if (!error) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const link = baseUrl ? `${baseUrl}?ref=${encodeURIComponent(code)}` : `?ref=${encodeURIComponent(code)}`
      return { ok: true, code, link }
    }
    if (error.code === '23505') {
      if (error.message.includes('user_referral_codes_pkey')) {
        const { data: row } = await supabase
          .from('user_referral_codes')
          .select('code')
          .eq('user_id', user.id)
          .single()
        if (row?.code) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
          const link = baseUrl ? `${baseUrl}?ref=${encodeURIComponent(row.code)}` : `?ref=${encodeURIComponent(row.code)}`
          return { ok: true, code: row.code, link }
        }
      }
      code = generateCode()
      continue
    }
    return { ok: false, error: error.message }
  }
  return { ok: false, error: 'Failed to create referral code' }
}

export type ReferralStats = {
  totalReferred: number
  completedFirstPurchase: number
}

/**
 * Get referral stats for the current user (count referred, count who completed first purchase).
 */
export async function getReferralStats(): Promise<ReferralStats | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from('referrals')
    .select('id, first_order_id')
    .eq('referrer_id', user.id)

  if (!rows?.length) return { totalReferred: 0, completedFirstPurchase: 0 }
  const completedFirstPurchase = rows.filter((r) => r.first_order_id != null).length
  return { totalReferred: rows.length, completedFirstPurchase }
}
