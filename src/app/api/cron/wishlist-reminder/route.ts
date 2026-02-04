import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendWishlistReminderEmail } from '@/lib/resend'

const CRON_SECRET = process.env.CRON_SECRET
const REMINDER_DAYS = 7

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron job: send wishlist reminder emails to users who have items in their wishlist
 * and have not been reminded in the last REMINDER_DAYS days.
 * Call with: Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = request.headers.get('x-cron-secret')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cronSecret

  if (CRON_SECRET && token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  const cutoff = new Date(Date.now() - REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentSent } = await supabase
    .from('wishlist_reminder_sent')
    .select('user_id')
    .gte('sent_at', cutoff)
  const recentlySentIds = new Set((recentSent ?? []).map((r) => r.user_id))

  const { data: wishlistRows, error: wishlistError } = await supabase
    .from('user_wishlist')
    .select('user_id')
  if (wishlistError) {
    console.error('Wishlist fetch error:', wishlistError)
    return NextResponse.json({ error: wishlistError.message }, { status: 500 })
  }

  const countByUser = new Map<string, number>()
  for (const row of wishlistRows ?? []) {
    countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1)
  }

  const toRemind = [...countByUser.entries()].filter(([uid]) => !recentlySentIds.has(uid))
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const wishlistUrl = baseUrl ? `${baseUrl}/en/account/wishlist` : '/en/account/wishlist'

  let sent = 0
  for (const [userId, itemCount] of toRemind) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.admin.getUserById(userId)
      if (userError || !user?.email) continue
      const result = await sendWishlistReminderEmail({
        to: user.email,
        wishlistUrl,
        itemCount,
      })
      if (result.ok) {
        await supabase.from('wishlist_reminder_sent').insert({ user_id: userId })
        sent++
      }
    } catch (err) {
      console.warn('Wishlist reminder send error:', err)
    }
  }

  return NextResponse.json({ ok: true, sent, total: toRemind.length })
}
