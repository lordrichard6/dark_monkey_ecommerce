'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPrintfulSyncStats,
  getPrintfulSyncProductIds,
  syncPrintfulProductById,
} from '@/actions/sync-printful'
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react'

type SyncState = 'idle' | 'counting' | 'confirming' | 'syncing' | 'complete' | 'error'

export function SyncPrintfulModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<SyncState>('idle')
  const [totalItems, setTotalItems] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentProductName, setCurrentProductName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const reset = useCallback(() => {
    setState('idle')
    setTotalItems(0)
    setProgress(0)
    setCurrentProductName('')
    setError(null)
    setLogs([])
  }, [])

  const startSyncFlow = async () => {
    setIsOpen(true)
    setState('counting')
    const res = await getPrintfulSyncStats()
    if (res.ok && res.total !== undefined) {
      setTotalItems(res.total)
      setState('confirming')
    } else {
      setError(res.error || 'Failed to fetch Printful stats')
      setState('error')
    }
  }

  const handleSync = async () => {
    setState('syncing')
    setError(null)

    try {
      // 1. Get all IDs (taking reasonable limit for now, or we could loop)
      const listRes = await getPrintfulSyncProductIds(100, 0)
      if (!listRes.ok || !listRes.products) {
        throw new Error(listRes.error || 'Failed to fetch product list')
      }

      const products = listRes.products
      const count = products.length
      setTotalItems(count)

      // 2. Sync one by one
      for (let i = 0; i < count; i++) {
        const p = products[i]
        setCurrentProductName(p.name)

        const res = await syncPrintfulProductById(p.id)
        if (res.ok) {
          setLogs((prev) => [`✅ Synced: ${p.name}`, ...prev.slice(0, 9)])
        } else {
          setLogs((prev) => [`❌ Error ${p.name}: ${res.error}`, ...prev.slice(0, 9)])
        }

        setProgress(Math.round(((i + 1) / count) * 100))
      }

      setState('complete')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setState('error')
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={startSyncFlow}
        className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors sm:w-auto"
      >
        Sync from Printful
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
        <div className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <RefreshCw className={`h-5 w-5 ${state === 'syncing' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-50">Printful Sync</h2>
              <p className="text-sm text-zinc-400">Manage your product catalog</p>
            </div>
          </div>

          {state === 'counting' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="mt-4 text-zinc-300 font-medium">Connecting to Printful...</p>
              <p className="text-xs text-zinc-500 mt-1">Fetching store information</p>
            </div>
          )}

          {state === 'confirming' && (
            <div className="py-2">
              <div className="rounded-xl bg-zinc-950/50 p-4 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Products found</span>
                  <span className="text-zinc-50 font-bold text-xl">{totalItems}</span>
                </div>
              </div>
              <p className="mt-6 text-sm text-zinc-400 leading-relaxed text-center">
                This will sync images, variants, and variants from your Printful store. Existing
                products will be updated.
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSync}
                  className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10 transition-colors"
                >
                  Sync Now
                </button>
              </div>
            </div>
          )}

          {state === 'syncing' && (
            <div className="py-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Syncing products...</span>
                <span className="text-sm font-bold text-amber-500">{progress}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-6 flex items-center gap-3 py-3 px-4 rounded-lg bg-zinc-950/30 border border-white/5">
                <Layers className="h-4 w-4 text-zinc-500" />
                <span className="text-xs text-zinc-400 truncate flex-1">
                  {currentProductName || 'Processing...'}
                </span>
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
              </div>

              <div className="mt-6 space-y-2">
                {logs.map((log, i) => (
                  <p
                    key={i}
                    className="text-[10px] font-mono text-zinc-500 truncate border-l border-zinc-800 pl-2"
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {state === 'complete' && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-50">Sync Complete!</h3>
              <p className="mt-2 text-zinc-400 text-sm max-w-[240px]">
                Catalog successfully updated with {totalItems} items.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false)
                  reset()
                }}
                className="mt-8 w-full rounded-xl bg-zinc-50 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-50">Sync Failed</h3>
              <p className="mt-2 text-red-400/80 text-sm">
                {error || 'An unexpected error occurred'}
              </p>
              <div className="mt-8 flex gap-3 w-full">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    reset()
                  }}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Close
                </button>
                <button
                  onClick={startSyncFlow}
                  className="flex-1 rounded-xl bg-zinc-50 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
