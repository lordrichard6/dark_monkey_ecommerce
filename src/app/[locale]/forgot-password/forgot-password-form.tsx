'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { requestPasswordReset } from '@/actions/password-reset'
import { Loader2 } from 'lucide-react'
import { MailIcon } from '@/components/icons/auth-icons'

export function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword')
  const tAuth = useTranslations('auth')
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      await requestPasswordReset(email.trim(), locale)
      setSent(true)
    } catch {
      setError(t('somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
        <div className="flex flex-col items-center p-10 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-emerald-400"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-50">{t('title')}</h2>
          <p className="mt-3 text-sm text-zinc-400">{t('checkEmailReset')}</p>
          <Link
            href="/login"
            className="mt-8 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            ← {t('backToSignIn')}
          </Link>
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
          <h1 className="text-2xl font-bold text-zinc-50">{t('title')}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t('instructions')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              {tAuth('email')}
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
                placeholder={tAuth('emailPlaceholder')}
                aria-label={tAuth('email')}
                className="block w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                aria-required="true"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
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
                <span>{t('sending')}</span>
              </div>
            ) : (
              t('sendResetLink')
            )}
          </button>

          <div className="flex justify-center">
            <Link href="/login" className="text-sm text-zinc-500 transition hover:text-amber-400">
              ← {t('backToSignIn')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
