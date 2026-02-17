'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Sends a password reset email to the given address via Supabase Auth.
 * The magic link redirects to `/auth/reset-password` after callback.
 * Returns `{ ok: true }` on success or `{ ok: false, error: string }` on failure.
 *
 * @param email - Email address of the account requesting a password reset.
 */
export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${base}/auth/callback?redirectTo=/auth/reset-password`,
  })
  if (error) return { ok: false, error: error.message }
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
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
