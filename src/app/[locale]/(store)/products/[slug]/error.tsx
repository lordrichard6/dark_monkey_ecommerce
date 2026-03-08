'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error('Product page error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">{t('error')}</h2>
      <p className="mb-4 max-w-sm text-zinc-400">{t('errorProductBody')}</p>
      <p className="mb-8 max-w-lg rounded border border-red-800/50 bg-red-950/30 px-4 py-2 font-mono text-xs text-red-300/80 break-all">
        {error?.message || 'Unknown error'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-amber-500 px-6 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-400"
        >
          {t('tryAgain')}
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-6 py-2.5 font-semibold text-zinc-300 transition hover:border-white/30 hover:text-white"
        >
          {t('backToShop')}
        </Link>
      </div>
    </div>
  )
}
