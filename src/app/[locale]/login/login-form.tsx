'use client'

import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { validateEmail } from '@/utils/email-validation'
import { Turnstile } from '@marsidev/react-turnstile'
import confetti from 'canvas-confetti'
import { trackEvent } from '@/lib/analytics'

function MailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-19-86.4-18.1-47.3 1.2-91.2 29.5-115.4 70.5-48.2 81.8-12.3 203.7 35.7 272.7 23.5 33.7 51.2 71.4 87.5 70.1 34.1-1.3 47.1-22 88.5-22s53.2 22 88.5 20.7c36.4-1.3 60.1-33.8 83.5-67.5 26.9-38.9 37.9-76.7 38.4-78.6-.8-.4-73.8-28.3-74-110.1zM249.1 89.2c19-22.9 31.8-54.7 28.3-86.3-26.6 1.1-58.8 17.8-77.8 40-16.9 19.6-31.7 51.8-27.8 82.5 29.7 2.3 60.3-15.3 77.3-36.2z" />
    </svg>
  )
}

type AuthMessage = {
  type: 'success' | 'error'
  text: string
  action?: { label: string; onClick: () => void }
}

export function LoginForm() {
  const locale = useLocale()
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)

  // Phase 2 states
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<any>(null)

  // Polishes & Advanced features
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | 'apple' | null>(null)
  const [resendCountdown, setResendCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignUp(true)
      trackEvent('view_item', { item_name: 'Auth Page - Signup' }) // Using generic track for funnel
    } else {
      trackEvent('view_item', { item_name: 'Auth Page - Signin' })
    }

    // Recovery of failed attempts count from session storage
    const saved = sessionStorage.getItem('auth_failed_attempts')
    if (saved) setFailedAttempts(parseInt(saved, 10))
  }, [searchParams])

  // Confetti on success
  useEffect(() => {
    if (signupSuccess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#f97316', '#ff2d55'],
        scalar: 1.2
      })
      trackEvent('unlock_achievement', { achievement_id: 'signup_success', achievement_name: 'Sign Up' })
    }
  }, [signupSuccess])

  // Email resend countdown
  useEffect(() => {
    if (!signupSuccess || resendCountdown <= 0) {
      if (resendCountdown <= 0) setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [signupSuccess, resendCountdown])

  // Email validation effect
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

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
    setOauthLoading(provider)
    trackEvent('login', { method: `oauth_${provider}` })

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    })

    if (error) {
      setOauthLoading(null)
      setMessage({ type: 'error', text: error.message })
      trackEvent('purchase', { item_name: 'Auth Error - OAuth', transaction_id: error.message }) // Hacky use of purchase for error tracking if no custom trackError
    }
  }

  const handleResendEmail = async () => {
    if (!canResend) return
    setCanResend(false)
    setResendCountdown(60)

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      // Success feedback could be toast or internal state
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setMessage({ type: 'error', text: t('emailRequired') })
      return
    }

    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: t('magicLinkSent') })
    }
  }

  const parseAuthError = (err: any): AuthMessage => {
    const errorMsg = err.message || t('somethingWrong')
    const lowerMsg = errorMsg.toLowerCase()

    if (lowerMsg.includes('already registered')) {
      return {
        type: 'error',
        text: t('errorEmailExists'),
        action: {
          label: t('signInInstead'),
          onClick: () => {
            setIsSignUp(false)
            setMessage(null)
          }
        }
      }
    }

    if (lowerMsg.includes('invalid') && (lowerMsg.includes('credentials') || lowerMsg.includes('password'))) {
      return {
        type: 'error',
        text: t('errorInvalidCredentials'),
        action: {
          label: t('resetPassword'),
          onClick: () => router.push('/forgot-password')
        }
      }
    }

    if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
      return {
        type: 'error',
        text: t('errorNetwork'),
        action: {
          label: t('retry'),
          onClick: () => handleSubmit(new Event('submit') as any)
        }
      }
    }

    if (lowerMsg.includes('too many') || lowerMsg.includes('rate limit')) {
      return {
        type: 'error',
        text: t('errorRateLimit')
      }
    }

    return { type: 'error', text: errorMsg }
  }

  async function handleSubmit(e: React.FormEvent) {
    if (e) e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Trim whitespace from email
    const trimmedEmail = email.trim()
    setEmail(trimmedEmail) // Update state too

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordsDoNotMatch') })
      setLoading(false)
      return
    }

    // CAPTCHA check
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
          // Always reset token on failure
          if (turnstileRef.current) turnstileRef.current.reset()
          setCaptchaToken(null)
          return
        }
      } catch (err) {
        console.error('CAPTCHA verification failed', err)
        // If our own API fails, still try to proceed? Prudent to block.
        setMessage({ type: 'error', text: t('errorNetwork') })
        setLoading(false)
        return
      }
    }

    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('supabaseNotConfigured'),
      })
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        trackEvent('view_item', { item_name: 'Auth Attempt - Signup' })
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
            // Pass the token to Supabase if available (optional support for Project Settings)
            captchaToken: captchaToken || undefined
          },
        })
        if (error) throw error
        setSignupSuccess(true)
        sessionStorage.removeItem('auth_failed_attempts')
      } else {
        trackEvent('login', { method: 'email' })
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
          options: {
            captchaToken: captchaToken || undefined
          }
        })
        if (error) throw error
        sessionStorage.removeItem('auth_failed_attempts')
        window.location.replace(`/${locale}/account`)
      }
    } catch (err: any) {
      console.error('Auth Error Full:', err) // Force log full error object
      const parsed = parseAuthError(err)

      // If error is generic or contains "blocked" or "security", explicitly show it
      // This helps with VPN blocks returning non-standard messages
      if (err.message && (err.message.toLowerCase().includes('security') || err.message.toLowerCase().includes('blocked'))) {
        parsed.text = err.message
      }

      setMessage(parsed)
      trackEvent('purchase', { item_name: 'Auth Error', transaction_id: err.message })

      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      sessionStorage.setItem('auth_failed_attempts', newAttempts.toString())

      // Always reset the executed token so we don't reuse it
      if (turnstileRef.current) {
        turnstileRef.current.reset()
      }
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  if (signupSuccess) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl" role="status" aria-live="polite">
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
          <h2 className="animate-success-fade-in text-xl font-semibold text-zinc-50">{t('accountCreated')}</h2>
          <p className="animate-success-fade-in mt-3 text-zinc-400">
            {t('checkEmail')}
          </p>
          <p className="animate-success-fade-in mt-4 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-medium text-transparent">
            {t('dressLikeVIP')}
          </p>
          <Link
            href="/categories"
            className="animate-success-fade-in mt-8 inline-block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
          >
            {t('startShopping')}
          </Link>

          <div className="animate-success-fade-in mt-8 flex flex-col gap-4">
            <button
              onClick={handleResendEmail}
              disabled={!canResend}
              className="text-sm font-medium text-zinc-400 transition hover:text-amber-400 disabled:opacity-40"
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
      {/* Gradient top accent */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />

      <div className="p-8 space-y-8">
        {/* Mode toggle */}
        <div className="flex rounded-xl bg-zinc-800/60 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => {
              setIsSignUp(false)
              setMessage(null)
              setConfirmPassword('')
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${!isSignUp
              ? 'bg-amber-500/20 text-amber-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            {t('signIn')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => {
              setIsSignUp(true)
              setMessage(null)
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${isSignUp
              ? 'bg-amber-500/20 text-amber-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            {t('signUp')}
          </button>
        </div>

        <form onSubmit={isMagicLink ? handleMagicLink : handleSubmit} className="space-y-6">
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
                aria-describedby={message ? "auth-message" : undefined}
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
                </button>?
              </p>
            )}
          </div>

          {/* Password (only if not magic link) */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${isMagicLink
              ? 'grid-rows-[0fr] opacity-0 invisible h-0'
              : 'grid-rows-[1fr] opacity-100'
              }`}
          >
            <div className="overflow-hidden space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                    {t('password')}
                  </label>
                  {!isSignUp && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-zinc-500 transition hover:text-amber-400"
                    >
                      {t('forgotPassword')}
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                    <LockIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isMagicLink}
                    minLength={8}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder={t('passwordPlaceholder')}
                    aria-label={t('password')}
                    aria-describedby={message ? "auth-message" : undefined}
                    aria-invalid={message?.type === 'error'}
                    className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-11 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:text-zinc-300"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {isSignUp && <PasswordStrengthMeter password={password} />}
              </div>
            </div>
          </div>

          {/* Confirm password (sign up only) */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${isSignUp && !isMagicLink
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 invisible'
              }`}
          >
            <div className="overflow-hidden">
              <div className="pt-4 space-y-2">
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
                    required={isSignUp}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    aria-label={t('confirmPassword')}
                    aria-describedby={message ? "auth-message" : undefined}
                    aria-invalid={message?.type === 'error'}
                    className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-11 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    aria-required={isSignUp}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:text-zinc-300"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-zinc-400 cursor-pointer select-none">
                {t('rememberMe')}
              </label>
            </div>
          )}

          {isSignUp && (
            <p className="text-xs text-zinc-500 leading-relaxed">
              {t('termsAgreement')} {' '}
              <Link href="/terms" className="text-zinc-400 underline decoration-zinc-700 hover:text-amber-400 transition-colors">
                {t('termsOfService')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href="/privacy" className="text-zinc-400 underline decoration-zinc-700 hover:text-amber-400 transition-colors">
                {t('privacyPolicy')}
              </Link>.
            </p>
          )}

          {/* CAPTCHA after 3 failures */}
          {failedAttempts >= 3 && !isSignUp && !isMagicLink && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} // Placeholder for testing
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
              className={`rounded-xl px-4 py-3 space-y-2 transition-all duration-300 animate-in fade-in zoom-in-95 ${message.type === 'error' ? 'animate-shake' : ''} ${message.type === 'success'
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

          {!isSignUp && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsMagicLink(!isMagicLink)
                  setMessage(null)
                }}
                className="text-xs font-medium text-amber-500/70 hover:text-amber-400 transition-colors"
              >
                {isMagicLink ? t('signInWithPassword') : t('useMagicLink')}
              </button>
            </div>
          )}

          <div className="pt-2 space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 active:scale-[0.98] outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {loading
                ? t(isSignUp ? 'creatingAccount' : isMagicLink ? 'pleaseWait' : 'signingIn')
                : isSignUp
                  ? t('createAccount')
                  : isMagicLink
                    ? t('sendMagicLink')
                    : t('signIn')}
            </button>

            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-3 text-zinc-500">{t('or')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={!!oauthLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-white py-2.5 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-100 active:scale-[0.98] ${oauthLoading === 'google' ? 'animate-pulse opacity-70' : ''}`}
                  title={t('continueWithGoogle')}
                >
                  {oauthLoading === 'google' ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-950" />
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
                        d="M12 4.6c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span className="sm:hidden">{t('continueWithGoogle')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={!!oauthLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800 py-2.5 text-sm font-bold text-zinc-100 transition-all hover:bg-zinc-700 active:scale-[0.98] ${oauthLoading === 'github' ? 'animate-pulse opacity-70' : ''}`}
                  title={t('continueWithGithub')}
                >
                  {oauthLoading === 'github' ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" />
                  ) : (
                    <GithubIcon className="h-5 w-5" />
                  )}
                  <span className="sm:hidden">{t('continueWithGithub')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={!!oauthLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-black py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-900 active:scale-[0.98] ${oauthLoading === 'apple' ? 'animate-pulse opacity-70' : ''}`}
                  title={t('continueWithApple')}
                >
                  {oauthLoading === 'apple' ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-100" />
                  ) : (
                    <AppleIcon className="h-5 w-5" />
                  )}
                  <span className="sm:hidden">{t('continueWithApple')}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
