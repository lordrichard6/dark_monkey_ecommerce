'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { requestAccountDeletion } from '@/actions/gdpr'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function DataDeletion() {
  const t = useTranslations('gdpr')
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleRequest() {
    setLoading(true)
    try {
      const result = await requestAccountDeletion(reason || undefined)
      if (!result.success) {
        toast.error(result.error ?? t('deleteError'))
        return
      }
      setSubmitted(true)
      setShowConfirm(false)
      toast.success(t('deleteSuccess'))
    } catch {
      toast.error(t('deleteError'))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <h3 className="mb-1 font-semibold text-amber-400">{t('deleteSubmittedTitle')}</h3>
            <p className="text-sm text-amber-300/80">{t('deleteSubmittedDescription')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-red-900/50 bg-zinc-900/50 p-6">
      <h3 className="mb-1 text-lg font-semibold text-zinc-50">{t('deleteTitle')}</h3>
      <p className="mb-4 text-sm text-zinc-400">{t('deleteDescription')}</p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/30"
        >
          <Trash2 className="h-4 w-4" />
          {t('deleteButton')}
        </button>
      ) : (
        <div className="space-y-4 rounded-lg border border-red-800/50 bg-red-950/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm font-medium text-red-400">{t('deleteWarning')}</p>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('deleteReasonPlaceholder')}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />

          <div className="flex gap-3">
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('deleteConfirmButton')}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-600"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
