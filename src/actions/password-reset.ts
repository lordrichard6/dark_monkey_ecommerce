'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/resend'

/**
 * Sends a password reset email via Resend using the Supabase admin API to
 * generate the recovery link without triggering Supabase's built-in email.
 * Always returns `{ ok: true }` to avoid leaking whether the email exists.
 *
 * @param email - Email address of the account requesting a password reset.
 * @param locale - Current UI locale for the email and redirect URL.
 */
export async function requestPasswordReset(email: string, locale: string = 'en') {
  const trimmedEmail = email.trim()
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectTo = `${base}/${locale}/auth/callback?redirectTo=/${locale}/auth/reset-password`

  const admin = getAdminClient()
  if (admin) {
    try {
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: trimmedEmail,
        options: { redirectTo },
      })
      if (!error && data?.properties?.action_link) {
        await sendPasswordResetEmail({
          to: trimmedEmail,
          resetUrl: data.properties.action_link,
          locale,
        })
      }
    } catch {
      // Silently ignore — never expose whether an account exists
    }
  } else {
    // Fallback: use Supabase's built-in email if admin client is unavailable
    try {
      const supabase = await createClient()
      await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo })
    } catch {
      // Silently ignore
    }
  }

  // Always return ok to avoid email enumeration
  return { ok: true }
}

/**
 * Updates the password of the currently authenticated Supabase user.
 * Must be called after the user has clicked a valid reset link (session is set by Supabase callback).
 * Returns `{ ok: true }` on success or `{ ok: false, error: string }` on failure.
 *
 * @param newPassword - The new plain-text password (Supabase enforces minimum length server-side).
 */
export async function updatePassword(newPassword: string) {
  const strengthCriteria = [
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  ]
  if (newPassword.length < 8 || strengthCriteria.filter(Boolean).length < 1) {
    return {
      ok: false,
      error:
        'Password must be at least 8 characters and include uppercase letters, numbers, or symbols.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
