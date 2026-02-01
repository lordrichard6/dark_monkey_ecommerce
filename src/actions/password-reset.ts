'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${base}/auth/callback?redirectTo=/auth/reset-password`,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
