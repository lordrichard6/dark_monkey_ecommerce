'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { validateEmail } from '@/utils/email-validation'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { trackEvent } from '@/lib/analytics'
import { Loader2 } from 'lucide-react'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '@/components/icons/auth-icons'

type AuthMessage = {
  type: 'success' | 'error'
  text: string
  action?: { label: string; onClick: () => void }
}

export function LoginForm() {
  const locale = useLocale()
  const t = useTranslations('auth')
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [isMagicLink, setIsMagicLink] = useState(false)

  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined)

  useEffect(() => {
    trackEvent('view_item', { item_name: 'Auth Page - Signin' })
    const saved = sessionStorage.getItem('auth_failed_attempts')
    if (saved) setFailedAttempts(parseInt(saved, 10))
  }, [])

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
      options: { emailRedirectTo: `${window.location.origin}/${locale}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: t('magicLinkSent') })
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
    const errorMsg = err instanceof Error ? err.message : String(err) || t('somethingWrong')
    const lowerMsg = errorMsg.toLowerCase()

    if (
      lowerMsg.includes('invalid') &&
      (lowerMsg.includes('credentials') || lowerMsg.includes('password'))
    ) {
      return {
        type: 'error',
        text: t('errorInvalidCredentials'),
        action: {
          label: t('resetPassword'),
          onClick: () => router.push('/forgot-password'),
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

    const isDev = process.env.NODE_ENV === 'development'

    if (!isDev && failedAttempts >= 3 && !captchaToken) {
      setMessage({ type: 'error', text: t('verifyCaptcha') })
      setLoading(false)
      return
    }

    if (!isDev && captchaToken) {
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
      trackEvent('login', { method: 'email' })
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
        options: { captchaToken: (!isDev && captchaToken) || undefined },
      })
      if (error) throw error

      // rememberMe: when unchecked, mark the session as non-persistent so
      // the server-side middleware can set a shorter cookie expiry.
      if (!rememberMe) {
        sessionStorage.setItem('auth_no_persist', '1')
      } else {
        sessionStorage.removeItem('auth_no_persist')
      }

      sessionStorage.removeItem('auth_failed_attempts')
      window.location.replace(`/${locale}/account`)
    } catch (err) {
      const parsed = parseAuthError(err)
      const errMsg = err instanceof Error ? err.message : ''
      if (
        errMsg &&
        (errMsg.toLowerCase().includes('security') || errMsg.toLowerCase().includes('blocked'))
      ) {
        parsed.text = errMsg
      }
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

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />

      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{t('signIn')}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t('noAccount')}{' '}
            <Link
              href="/signup"
              className="font-medium text-amber-500 hover:text-amber-400 transition-colors"
            >
              {t('goToSignup')}
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
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-600">{t('or')}</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={isMagicLink ? handleMagicLink : handleSubmit} className="space-y-5">
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

          {/* Password (hidden in magic link mode) */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isMagicLink
                ? 'grid-rows-[0fr] opacity-0 invisible h-0'
                : 'grid-rows-[1fr] opacity-100'
            }`}
          >
            <div className="overflow-hidden space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                  {t('password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-500 transition hover:text-amber-400"
                >
                  {t('forgotPassword')}
                </Link>
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
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  aria-label={t('password')}
                  aria-describedby={message ? 'auth-message' : undefined}
                  aria-invalid={message?.type === 'error'}
                  className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-11 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  aria-required={!isMagicLink}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:text-zinc-300"
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember me */}
          {!isMagicLink && (
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-sm text-zinc-400 cursor-pointer select-none"
              >
                {t('rememberMe')}
              </label>
            </div>
          )}

          {/* CAPTCHA after 3 failures */}
          {failedAttempts >= 3 && !isMagicLink && (
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

          {/* Magic link toggle */}
          <div className="flex justify-center pt-1">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 active:scale-[0.98] outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t(isMagicLink ? 'pleaseWait' : 'signingIn')}</span>
              </div>
            ) : isMagicLink ? (
              t('sendMagicLink')
            ) : (
              t('signIn')
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
