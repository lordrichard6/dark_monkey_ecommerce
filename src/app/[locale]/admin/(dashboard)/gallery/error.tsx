'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function AdminGalleryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin gallery error:', error)
  }, [error])

  return (
    <div className="p-8 flex flex-col items-center justify-center text-center min-h-[50vh]">
      <div className="w-16 h-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-zinc-50 mb-2">Something went wrong</h2>
      <p className="text-zinc-400 mb-6 max-w-sm">
        Failed to load the gallery admin panel. Please try again.
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
