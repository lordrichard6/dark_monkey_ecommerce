'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

export default function ArtGalleryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error('Art gallery error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 mt-16 md:mt-0 flex flex-col items-center justify-center text-center min-h-[50vh]">
      <div className="w-16 h-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{t('error')}</h2>
      <p className="text-zinc-400 mb-6 max-w-sm">
        Something went wrong while loading the gallery. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-full bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 transition"
      >
        Try again
      </button>
    </div>
  )
}
