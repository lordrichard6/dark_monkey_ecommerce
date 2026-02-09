'use client'

import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

function MailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

export function LoginForm() {
  const locale = useLocale()
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') setIsSignUp(true)
  }, [searchParams])

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordsDoNotMatch') })
      setLoading(false)
      return
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/${locale}/auth/callback` },
        })
        if (error) throw error
        setSignupSuccess(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.replace(`/${locale}/account`)
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('somethingWrong'),
      })
    } finally {
      setLoading(false)
    }
  }

  if (signupSuccess) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
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
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="animate-success-fade-in text-xl font-semibold text-zinc-50">Account created</h2>
          <p className="animate-success-fade-in mt-3 text-zinc-400">
            Check your email for the confirmation link.
          </p>
          <p className="animate-success-fade-in mt-4 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-medium text-transparent">
            Now you will dress like a VIP.
          </p>
          <Link
            href="/categories"
            className="animate-success-fade-in mt-8 inline-block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
          >
            Start shopping
          </Link>
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
        <div className="flex rounded-xl bg-zinc-800/60 p-1">
          <button
            type="button"
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
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true)
              setMessage(null)
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${isSignUp
              ? 'bg-amber-500/20 text-amber-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Email
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
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className={`transition-all duration-300 ${isSignUp ? 'opacity-0 invisible h-0' : 'opacity-100 visible h-auto'}`}>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-zinc-500 transition hover:text-amber-400"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
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
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-11 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:text-zinc-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm password (sign up only) */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${isSignUp
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 invisible'
              }`}
          >
            <div className="overflow-hidden">
              <div className="pt-4 space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
                  Confirm password
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
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-11 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:text-zinc-300"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm transition-all duration-300 ${message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
                }`}
            >
              {message.text}
            </div>
          )}

          <div className="pt-2 space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>

            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-3 text-zinc-500">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-black/10 transition-all duration-300 hover:bg-zinc-100 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                Continue with Google
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
