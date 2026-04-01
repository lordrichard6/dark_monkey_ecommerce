'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { syncPrintfulCosts } from '@/actions/accounting'
import { useTranslations } from 'next-intl'

interface SyncResult {
  synced: number
  failed: number
}

export function SyncPrintfulCostsButton({ unsyncedCount }: { unsyncedCount: number }) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SyncResult | null>(null)

  function handleSync() {
    setResult(null)
    startTransition(async () => {
      const res = await syncPrintfulCosts()
      setResult(res)
      if (res.synced > 0) {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleSync}
        disabled={isPending || unsyncedCount === 0}
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[12px] font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? t('accounting.syncing') : t('accounting.syncCosts', { n: unsyncedCount })}
      </button>

      {result && (
        <span className="flex items-center gap-1.5 text-[12px]">
          {result.synced > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('accounting.syncedOk', { n: result.synced })}
            </span>
          )}
          {result.failed > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="h-3.5 w-3.5" />
              {t('accounting.syncedFailed', { n: result.failed })}
            </span>
          )}
        </span>
      )}
    </div>
  )
}
