'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error('[Store] Page error:', error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('error')}</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Something went wrong loading this page. This is usually temporary — please try again.
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
