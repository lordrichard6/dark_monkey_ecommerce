'use client'

import { useState } from 'react'
import { syncPrintfulProducts } from '@/actions/sync-printful'

export function SyncPrintfulButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [serverLogs, setServerLogs] = useState<string[]>([])

  async function handleSync() {
    setLoading(true)
    setMessage(null)
    setServerLogs([])
    try {
      // 5 minute timeout for large syncs
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Request timed out. The sync is taking longer than expected but is likely still running in the background.'
              )
            ),
          300000
        )
      )

      const result = (await Promise.race([
        syncPrintfulProducts(true),
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof syncPrintfulProducts>>

      if (result.ok) {
        const msg = result.error ?? `Synced ${result.synced ?? 0} products`
        setMessage(msg)
      } else {
        setMessage(result.error ?? 'Sync failed')
      }

      if (result.logs && result.logs.length > 0) {
        setServerLogs(result.logs)
        console.group('🚀 Printful Sync Server Logs')
        result.logs.forEach(log => console.log(log))
        console.groupEnd()
      }
    } catch (err) {
      console.error(err)
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

      {serverLogs.length > 0 && (
        <div className="mt-4 w-full rounded-lg border border-blue-800 bg-blue-950/50 p-4">
          <h3 className="mb-2 text-sm font-bold text-blue-200">Server Sync Logs</h3>
          <pre className="whitespace-pre-wrap break-all text-xs text-blue-100 font-mono">
            {serverLogs.join('\n\n')}
          </pre>
        </div>
      )}
    </div>
  )
}

