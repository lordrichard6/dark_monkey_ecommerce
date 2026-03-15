import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/account'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const response = NextResponse.redirect(`${origin}${redirectTo}`)

      // 1. Referral Logic
      const referralCode = request.cookies.get('dm_ref')?.value
      if (referralCode && referralCode.trim()) {
        const admin = getSupabaseAdmin()
        if (admin) {
          const { data: refRow } = await admin
            .from('user_referral_codes')
            .select('user_id')
            .eq('code', referralCode.trim())
            .single()

          const referrerId = refRow?.user_id
          if (referrerId && referrerId !== data.user.id) {
            await admin.from('referrals').insert({
              referrer_id: referrerId,
              referred_user_id: data.user.id,
              referral_code: referralCode.trim(),
            })
          }
        }
        response.cookies.set('dm_ref', '', { maxAge: 0, path: '/' })
      }

      // 2. Claim Guest Orders Logic
      if (data.user.email) {
        try {
          const { claimGuestOrdersForUser } = await import('@/lib/orders-claim')
          await claimGuestOrdersForUser(data.user.id, data.user.email)
        } catch (e) {
          console.error('Failed to claim guest orders in callback:', e)
        }
      }

      // 3. Welcome email for new users (non-fatal)
      const isNewUser =
        data.user.created_at &&
        Math.abs(new Date(data.user.created_at).getTime() - Date.now()) < 60_000
      if (isNewUser && data.user.email) {
        const locale = (new URL(request.url).pathname.match(/^\/([a-z]{2})\//) || [])[1] ?? 'en'
        sendWelcomeEmail({
          to: data.user.email,
          firstName: data.user.user_metadata?.full_name?.split(' ')[0] as string | undefined,
          locale,
        }).catch(console.error)
      }

      return response
    }
  }

  const localeMatch = new URL(request.url).pathname.match(/^\/([a-z]{2})\//)
  const locale = localeMatch ? localeMatch[1] : 'en'
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`)
}
