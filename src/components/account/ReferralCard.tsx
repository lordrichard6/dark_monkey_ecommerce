'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { getOrCreateReferralCode, getReferralStats } from '@/actions/referrals'

export function ReferralCard() {
  const t = useTranslations('account')
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<{ totalReferred: number; completedFirstPurchase: number } | null>(null)

  useEffect(() => {
    getOrCreateReferralCode().then((res) => {
      if (res.ok) setLink(res.link)
      else setError(res.error)
    })
    getReferralStats().then(setStats)
  }, [])

  async function handleCopy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed')
    }
  }

  if (error && !link) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('referralTitle')}</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-400">
          {error}
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('referralTitle')}</h2>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
        <p className="mb-4 text-sm text-zinc-400">{t('referralDescription')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-xs font-medium text-zinc-500">{t('referralYourLink')}</label>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readOnly
              value={link ?? ''}
              className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200"
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={!link}
              className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50"
            >
              {copied ? t('referralCopied') : t('referralCopy')}
            </button>
          </div>
        </div>
        {stats != null && (
          <p className="mt-4 text-sm text-zinc-500">
            {stats.totalReferred === 0
              ? t('referralStatsNone')
              : t('referralStats', { total: stats.totalReferred, completed: stats.completedFirstPurchase })}
          </p>
        )}
      </div>
    </section>
  )
}
