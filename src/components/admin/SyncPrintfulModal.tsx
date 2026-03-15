'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPrintfulSyncStats,
  getPrintfulSyncProductIds,
  syncPrintfulProductById,
} from '@/actions/sync-printful'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

type SyncState =
  | 'idle'
  | 'counting'
  | 'confirming'
  | 'confirming-all'
  | 'syncing'
  | 'complete'
  | 'error'

export function SyncPrintfulModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<SyncState>('idle')
  const [totalItems, setTotalItems] = useState(0)
  const [existingCount, setExistingCount] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [newProducts, setNewProducts] = useState<{ id: number; name: string }[]>([])
  const [progress, setProgress] = useState(0)
  const [syncedCount, setSyncedCount] = useState(0)
  const [currentProductName, setCurrentProductName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const reset = useCallback(() => {
    setState('idle')
    setTotalItems(0)
    setExistingCount(0)
    setNewCount(0)
    setNewProducts([])
    setProgress(0)
    setSyncedCount(0)
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
      setExistingCount(res.existingCount ?? 0)
      setNewCount(res.newCount ?? 0)
      setNewProducts(res.newProducts ?? [])
      setState('confirming')
    } else {
      setError(res.error || 'Failed to fetch Printful stats')
      setState('error')
    }
  }

  /** Sync a specific list of products (new-only or all). */
  const handleSync = async (products: { id: number; name: string }[]) => {
    setState('syncing')
    setError(null)
    setSyncedCount(products.length)

    try {
      for (let i = 0; i < products.length; i++) {
        const p = products[i]
        setCurrentProductName(p.name)

        const res = await syncPrintfulProductById(p.id)
        if (res.ok) {
          setLogs((prev) => [`✅ Synced: ${p.name}`, ...prev.slice(0, 9)])
        } else {
          setLogs((prev) => [`❌ Error ${p.name}: ${res.error}`, ...prev.slice(0, 9)])
        }

        setProgress(Math.round(((i + 1) / products.length) * 100))
      }

      setState('complete')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setState('error')
    }
  }

  /** "Sync New Only" — uses the IDs already returned from getPrintfulSyncStats */
  const handleSyncNew = () => handleSync(newProducts)

  /** "Sync All" — show confirmation warning before proceeding */
  const handleSyncAll = () => setState('confirming-all')

  /** Actually execute Sync All after user confirms the warning */
  const proceedSyncAll = async () => {
    setState('syncing')
    setError(null)
    try {
      const listRes = await getPrintfulSyncProductIds(100, 0)
      if (!listRes.ok || !listRes.products) {
        throw new Error(listRes.error || 'Failed to fetch product list')
      }
      await handleSync(listRes.products)
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
              <div className="rounded-xl bg-zinc-950/50 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-zinc-400 text-sm">Products in Printful</span>
                  <span className="text-zinc-50 font-bold text-lg">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-zinc-400 text-sm">Already in your store</span>
                  <span className="text-zinc-300 font-semibold">{existingCount}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-amber-500/5">
                  <span className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    New items
                  </span>
                  <span
                    className={`font-bold text-lg ${newCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}
                  >
                    {newCount}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                {newCount > 0 && (
                  <button
                    onClick={handleSyncNew}
                    className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10 transition-colors"
                  >
                    Sync New Only ({newCount})
                  </button>
                )}
                <button
                  onClick={handleSyncAll}
                  className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                    newCount > 0
                      ? 'border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'
                      : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10'
                  }`}
                >
                  Sync All ({totalItems})
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-zinc-700 bg-transparent py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {state === 'confirming-all' && (
            <div className="py-2">
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-5">
                <TriangleAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300 mb-1">
                    This will overwrite existing data
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Syncing all {totalItems} products will:
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {[
                  'Replace all Printful product images with fresh versions from Printful',
                  'Update prices and variant attributes for every product',
                  'Restore any previously hidden/deleted Printful products back to active',
                  'Clean up orphaned variant records from deleted products',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="mt-0.5 text-amber-500 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-zinc-500 mb-5 text-center">
                Custom images you uploaded manually will not be affected.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={proceedSyncAll}
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10 transition-colors"
                >
                  Yes, Sync All ({totalItems})
                </button>
                <button
                  onClick={() => setState('confirming')}
                  className="w-full rounded-xl border border-zinc-700 bg-transparent py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Go Back
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
                Catalog successfully updated with {syncedCount} item{syncedCount !== 1 ? 's' : ''}.
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
