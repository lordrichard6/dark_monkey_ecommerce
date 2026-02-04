'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateProfile } from '@/actions/profile'

type Props = { displayName: string | null }

export function ProfileEditForm({ displayName }: Props) {
  const t = useTranslations('account')
  const tCommon = useTranslations('common')
  const [name, setName] = useState(displayName ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const result = await updateProfile(name)
    setLoading(false)
    if (result.ok) {
      setMessage({ type: 'success', text: t('profileUpdated') })
    } else {
      setMessage({ type: 'error', text: result.error ?? t('failedToUpdate') })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-zinc-300">
          {t('displayName')}
        </label>
        <input
          id="displayName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder={t('displayNamePlaceholder')}
        />
      </div>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? t('saving') : tCommon('save')}
      </button>
    </form>
  )
}
