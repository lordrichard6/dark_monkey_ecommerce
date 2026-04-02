'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { sendConfirmationEmail, sendMagicLinkEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.dark-monkey.ch'

export type SignUpResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'EMAIL_EXISTS' | 'RESEND_FAILED' | 'SERVER_ERROR' }

/**
 * Creates a new user via the Supabase admin API and sends the email confirmation
 * link through Resend instead of Supabase's built-in mailer.
 *
 * IMPORTANT: Disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email
 * to prevent Supabase from also sending its own confirmation email.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  locale: string,
  name?: string
): Promise<SignUpResult> {
  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Service not configured', code: 'SERVER_ERROR' }

  // generateLink creates the user (if they don't exist) and returns a signed confirmation URL.
  // It does NOT automatically send an email when called via the admin API.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      redirectTo: `${APP_URL}/${locale}/auth/callback`,
    },
  })

  if (error) {
    const isExisting =
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists')
    return {
      ok: false,
      error: error.message,
      code: isExisting ? 'EMAIL_EXISTS' : 'SERVER_ERROR',
    }
  }

  const confirmationUrl = data?.properties?.action_link
  if (!confirmationUrl) {
    return { ok: false, error: 'Failed to generate confirmation link', code: 'SERVER_ERROR' }
  }

  // Persist display name on the profile if provided
  const userId = data?.user?.id
  if (userId && name) {
    await supabase.from('user_profiles').upsert({ id: userId, display_name: name }).eq('id', userId)
  }

  const result = await sendConfirmationEmail({ to: email, confirmationUrl, locale })
  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? 'Failed to send confirmation email',
      code: 'RESEND_FAILED',
    }
  }

  return { ok: true }
}

export type MagicLinkResult = { ok: true } | { ok: false; error: string }

/**
 * Generates a magic link for passwordless sign-in via the Supabase admin API
 * and sends it via Resend with our custom branded template.
 */
export async function sendMagicLink(email: string, locale: string): Promise<MagicLinkResult> {
  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Service not configured' }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${APP_URL}/${locale}/auth/callback`,
    },
  })

  if (error) return { ok: false, error: error.message }

  const magicLinkUrl = data?.properties?.action_link
  if (!magicLinkUrl) return { ok: false, error: 'Failed to generate magic link' }

  const result = await sendMagicLinkEmail({ to: email, magicLinkUrl, locale })
  if (!result.ok) return { ok: false, error: result.error ?? 'Failed to send magic link email' }

  return { ok: true }
}

/**
 * Regenerates a confirmation link for an unconfirmed user and re-sends it via Resend.
 * Safe to call for existing unconfirmed users — generates a fresh OTP.
 */
export async function resendConfirmationEmail(
  email: string,
  locale: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Service not configured' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.auth.admin.generateLink as any)({
    type: 'signup',
    email,
    options: {
      redirectTo: `${APP_URL}/${locale}/auth/callback`,
    },
  })

  if (error) return { ok: false, error: error.message }

  const confirmationUrl = data?.properties?.action_link
  if (!confirmationUrl) return { ok: false, error: 'Failed to generate link' }

  return sendConfirmationEmail({ to: email, confirmationUrl, locale })
}
