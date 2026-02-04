'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updatePassword } from '@/actions/password-reset'

export function ResetPasswordForm() {
  const router = useRouter()
  const t = useTranslations('resetPassword')
  const tAuth = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const result = await updatePassword(password)
    setLoading(false)
    if (result.ok) {
      setMessage({ type: 'success', text: t('passwordUpdated') })
      router.refresh()
      router.push('/account')
    } else {
      setMessage({ type: 'error', text: result.error ?? tAuth('somethingWrong') })
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6"
    >
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          {t('newPassword')}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="••••••••"
        />
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? t('updating') : t('updatePassword')}
      </button>
    </form>
  )
}
