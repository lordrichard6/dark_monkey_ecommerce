'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportUserData } from '@/actions/gdpr'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function DataExport() {
  const t = useTranslations('gdpr')
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const result = await exportUserData()
      if (!result.success || !result.data) {
        toast.error(result.error ?? t('exportError'))
        return
      }

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `darkmonkey-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('exportSuccess'))
    } catch {
      toast.error(t('exportError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-1 text-lg font-semibold text-zinc-50">{t('exportTitle')}</h3>
      <p className="mb-4 text-sm text-zinc-400">{t('exportDescription')}</p>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {loading ? t('exportLoading') : t('exportButton')}
      </button>
    </div>
  )
}
