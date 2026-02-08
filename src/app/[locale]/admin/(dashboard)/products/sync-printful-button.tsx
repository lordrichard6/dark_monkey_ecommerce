'use client'

import { useState } from 'react'
import { syncPrintfulProducts, type PrintfulDebugEntry } from '@/actions/sync-printful'

export function SyncPrintfulButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<PrintfulDebugEntry[] | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  async function handleSync() {
    setLoading(true)
    setMessage(null)
    setDebugLog(null)
    try {
      const result = await syncPrintfulProducts(true)
      if (result.ok) {
        const msg = result.error ?? `Synced ${result.synced ?? 0} products`
        setMessage(msg)
      } else {
        setMessage(result.error ?? 'Sync failed')
      }
      if (result.debugLog) setDebugLog(result.debugLog)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full sm:w-auto">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Syncing…' : 'Sync from Printful'}
        </button>
        {message && (
          <span className="text-center text-sm text-zinc-400 sm:text-left">{message}</span>
        )}
      </div>
      {debugLog && debugLog.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setShowDebug((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-zinc-400 hover:text-zinc-200"
          >
            Printful API debug log ({debugLog.length} entries)
            <span className="text-zinc-500">{showDebug ? '▼' : '▶'}</span>
          </button>
          {showDebug && (
            <div className="max-h-96 overflow-auto border-t border-zinc-700 p-4">
              <pre className="whitespace-pre-wrap break-all text-xs text-zinc-400">
                {debugLog.map((entry, i) => (
                  <details key={i} className="mb-4">
                    <summary className="cursor-pointer font-medium text-zinc-300">
                      [{i + 1}] {entry.api}
                      {entry.productName != null && ` — ${entry.productName}`}
                      {entry.productId != null && ` (id: ${entry.productId})`}
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded bg-zinc-950 p-2 text-[11px]">
                      {JSON.stringify(entry.raw, null, 2)}
                    </pre>
                  </details>
                ))}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
