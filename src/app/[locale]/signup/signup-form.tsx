'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { signUpWithEmail, resendConfirmationEmail } from '@/actions/auth-signup'
import { useState, useEffect, useRef, useCallback } from 'react'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { validateEmail } from '@/utils/email-validation'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import confetti from 'canvas-confetti'
import { trackEvent } from '@/lib/analytics'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '@/components/icons/auth-icons'

type AuthMessage = {
  type: 'success' | 'error'
  text: string
  action?: { label: string; onClick: () => void }
}

type Props = {
  initialEmail?: string
}

export function SignupForm({ initialEmail = '' }: Props) {
  const locale = useLocale()
  const t = useTranslations('auth')

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined)

  // Resend countdown — interval managed via ref so deps array stays stable
  const [resendCountdown, setResendCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    trackEvent('view_item', { item_name: 'Auth Page - Signup' })
    const saved = sessionStorage.getItem('auth_failed_attempts')
    if (saved) setFailedAttempts(parseInt(saved, 10))
  }, [])

  // Start / restart the 60-second resend countdown
  const startCountdown = useCallback(() => {
    setResendCountdown(60)
    setCanResend(false)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (signupSuccess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#f97316', '#ff2d55'],
        scalar: 1.2,
      })
      trackEvent('unlock_achievement', {
        achievement_id: 'signup_success',
        achievement_name: 'Sign Up',
      })
      startCountdown()
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [signupSuccess, startCountdown])

  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailSuggestion(null)
      return
    }
    const timer = setTimeout(() => {
      const { suggestion } = validateEmail(email)
      setEmailSuggestion(suggestion || null)
    }, 600)
    return () => clearTimeout(timer)
  }, [email])

  // Derived real-time password match state — only shows once user starts typing confirm
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleResendEmail = async () => {
    if (!canResend) return
    try {
      const result = await resendConfirmationEmail(email, locale)
      if (!result.ok) {
        setMessage({ type: 'error', text: result.error ?? t('somethingWrong') })
        setCanResend(true) // let user retry immediately on error
      } else {
        startCountdown()
        trackEvent('view_item', { item_name: 'Auth Resend - Signup' })
      }
    } catch {
      setMessage({ type: 'error', text: t('errorNetwork') })
      setCanResend(true)
    }
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
        setOauthLoading(null)
      }
      // On success Supabase redirects the browser — no further action needed
    } catch {
      setMessage({ type: 'error', text: t('errorNetwork') })
      setOauthLoading(null)
    }
  }

  const parseAuthError = (err: unknown): AuthMessage => {
    const code = (err as { code?: string })?.code
    const errorMsg =
      err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || String(err || '') || t('somethingWrong')
    const lowerMsg = errorMsg.toLowerCase()

    if (code === 'EMAIL_EXISTS' || lowerMsg.includes('already registered')) {
      return {
        type: 'error',
        text: t('errorEmailExists'),
        action: {
          label: t('goToLogin'),
          onClick: () => window.location.assign(`/${locale}/login`),
        },
      }
    }

    if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
      return { type: 'error', text: t('errorNetwork') }
    }

    if (lowerMsg.includes('too many') || lowerMsg.includes('rate limit')) {
      return { type: 'error', text: t('errorRateLimit') }
    }

    return { type: 'error', text: errorMsg }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const trimmedEmail = email.trim()
    setEmail(trimmedEmail)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordsDoNotMatch') })
      setLoading(false)
      return
    }

    // Enforce minimum password strength: must pass at least 2 of 4 criteria
    // (mirrors the PasswordStrengthMeter checks — "medium" or better)
    const strengthCriteria = [
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ]
    if (password.length < 8 || strengthCriteria.filter(Boolean).length < 1) {
      setMessage({ type: 'error', text: t('passwordTooWeak') })
      setLoading(false)
      return
    }

    if (failedAttempts >= 3 && !captchaToken) {
      setMessage({ type: 'error', text: t('verifyCaptcha') })
      setLoading(false)
      return
    }

    if (captchaToken) {
      try {
        const verify = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          body: JSON.stringify({ token: captchaToken }),
          headers: { 'Content-Type': 'application/json' },
        })
        const result = await verify.json()
        if (!result.success) {
          setMessage({ type: 'error', text: t('verifyCaptcha') })
          setLoading(false)
          if (turnstileRef.current) turnstileRef.current.reset()
          setCaptchaToken(null)
          return
        }
      } catch {
        setMessage({ type: 'error', text: t('errorNetwork') })
        setLoading(false)
        return
      }
    }

    try {
      trackEvent('sign_up', { method: 'email' })
      const result = await signUpWithEmail(trimmedEmail, password, locale)
      if (!result.ok) {
        const parsed = parseAuthError({ message: result.error ?? '', code: result.code })
        setMessage(parsed)
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)
        sessionStorage.setItem('auth_failed_attempts', newAttempts.toString())
        if (turnstileRef.current) turnstileRef.current.reset()
        setCaptchaToken(null)
      } else {
        setSignupSuccess(true)
        sessionStorage.removeItem('auth_failed_attempts')
      }
    } catch (err) {
      const parsed = parseAuthError(err)
      setMessage(parsed)
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      sessionStorage.setItem('auth_failed_attempts', newAttempts.toString())
      if (turnstileRef.current) turnstileRef.current.reset()
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  if (signupSuccess) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
        <div className="flex flex-col items-center p-10 text-center">
          <div className="animate-success-pop mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-emerald-400 animate-success-fade-in"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="animate-success-fade-in text-xl font-semibold text-zinc-50">
            {t('accountCreated')}
          </h2>
          <p className="animate-success-fade-in mt-3 text-zinc-400">{t('checkEmail')}</p>
          {/* Show the exact email address the link was sent to */}
          <p className="animate-success-fade-in mt-1 break-all text-sm font-medium text-amber-400">
            {email}
          </p>
          {/* Spam warning */}
          <div className="animate-success-fade-in mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-left max-w-sm w-full">
            <span className="mt-0.5 text-base shrink-0">📬</span>
            <p className="text-xs text-amber-300/80 leading-relaxed">{t('spamWarning')}</p>
          </div>
          <p className="animate-success-fade-in mt-4 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-medium text-transparent">
            {t('dressLikeVIP')}
          </p>
          <Link
            href="/categories"
            className="animate-success-fade-in mt-8 inline-block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
          >
            {t('startShopping')}
          </Link>

          <div className="animate-success-fade-in mt-8 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={!canResend}
              className="text-sm font-medium text-zinc-400 transition hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {canResend ? t('resendEmail') : `${t('resendIn')} ${resendCountdown}s`}
            </button>

            <div className="flex items-center justify-center gap-4 pt-2">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Gmail
              </a>
              <span className="h-1 w-1 rounded-full bg-zinc-800" />
              <a
                href="https://outlook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Outlook
              </a>
            </div>

            {/* Inline error from resend attempts */}
            {message?.type === 'error' && <p className="text-xs text-red-400">{message.text}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />

      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{t('signUp')}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t('alreadyHaveAccountLink')}{' '}
            <Link
              href="/login"
              className="font-medium text-amber-500 hover:text-amber-400 transition-colors"
            >
              {t('goToLogin')}
            </Link>
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700/60 disabled:opacity-50"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {t('continueWithGoogle')}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={!!oauthLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700/60 disabled:opacity-50"
          >
            {oauthLoading === 'apple' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            )}
            {t('continueWithApple')}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-600">{t('or')}</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              {t('email')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <MailIcon className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                aria-label={t('email')}
                aria-describedby={message ? 'auth-message' : undefined}
                aria-invalid={message?.type === 'error'}
                className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                aria-required="true"
              />
            </div>
            {emailSuggestion && (
              <p className="text-[11px] text-amber-400/80 mt-1 animate-in fade-in slide-in-from-left-1 duration-300">
                {t('didYouMean')}{' '}
                <button
                  type="button"
                  onClick={() => setEmail(emailSuggestion)}
                  className="font-bold underline decoration-amber-500/30 hover:text-amber-300 transition-colors"
                >
                  {emailSuggestion}
                </button>
                ?
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              {t('password')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <LockIcon className="h-5 w-5" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={t('passwordPlaceholder')}
                aria-label={t('password')}
                className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-11 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-2 text-zinc-500 transition hover:text-zinc-300"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {password && <PasswordStrengthMeter password={password} />}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <LockIcon className="h-5 w-5" />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={t('confirmPasswordPlaceholder')}
                aria-label={t('confirmPassword')}
                aria-describedby={message ? 'auth-message' : undefined}
                aria-invalid={passwordsMismatch || message?.type === 'error'}
                className={`block w-full rounded-xl border py-3 pl-11 pr-[4.5rem] text-zinc-100 placeholder-zinc-500 transition focus:outline-none focus:ring-2 bg-zinc-800/80 ${
                  passwordsMatch
                    ? 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                    : passwordsMismatch
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                      : 'border-zinc-700/80 focus:border-amber-500/50 focus:ring-amber-500/20'
                }`}
                aria-required="true"
              />
              {/* Match/mismatch icon — left of the show/hide button */}
              {confirmPassword.length > 0 && (
                <span className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2">
                  {passwordsMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-2 text-zinc-500 transition hover:text-zinc-300"
                aria-label={
                  showConfirmPassword ? t('hideConfirmPassword') : t('showConfirmPassword')
                }
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Inline mismatch hint below the field */}
            {passwordsMismatch && (
              <p
                className="text-[11px] text-red-400 animate-in fade-in slide-in-from-left-1 duration-200"
                role="alert"
              >
                {t('passwordsDoNotMatch')}
              </p>
            )}
          </div>

          {/* Terms */}
          <p className="text-xs text-zinc-500 leading-relaxed">
            {t('termsAgreement')}{' '}
            <Link
              href="/terms"
              className="text-zinc-400 underline decoration-zinc-700 hover:text-amber-400 transition-colors"
            >
              {t('termsOfService')}
            </Link>{' '}
            {t('and')}{' '}
            <Link
              href="/privacy"
              className="text-zinc-400 underline decoration-zinc-700 hover:text-amber-400 transition-colors"
            >
              {t('privacyPolicy')}
            </Link>
            .
          </p>

          {/* CAPTCHA after 3 failures */}
          {failedAttempts >= 3 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setCaptchaToken(token)}
                options={{ theme: 'dark' }}
                className="w-full flex justify-center"
              />
            </div>
          )}

          {message && (
            <div
              id="auth-message"
              role="alert"
              aria-live="polite"
              className={`rounded-xl px-4 py-3 space-y-2 transition-all duration-300 animate-in fade-in zoom-in-95 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              {message.action && (
                <button
                  type="button"
                  onClick={message.action.onClick}
                  className="block text-xs font-bold uppercase tracking-wider text-amber-500/80 hover:text-amber-400 transition-colors"
                >
                  {message.action.label} →
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 active:scale-[0.98] outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('creatingAccount')}</span>
              </div>
            ) : (
              t('createAccount')
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
