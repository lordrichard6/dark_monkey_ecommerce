'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react'
import { requestAccountDeletion, cancelAccountDeletion } from '@/actions/gdpr'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

type ExistingRequest = {
  status: 'pending' | 'processing' | 'completed'
  requested_at: string
} | null

type Props = {
  existingRequest?: ExistingRequest
}

const DEADLINE_DAYS = 30

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Request submitted', icon: Clock },
  { key: 'processing', label: 'Under review', icon: Loader2 },
  { key: 'completed', label: 'Account deleted', icon: CheckCircle2 },
] as const

export function DataDeletion({ existingRequest }: Props) {
  const t = useTranslations('gdpr')
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<ExistingRequest>(existingRequest ?? null)

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
      setPendingRequest({ status: 'pending', requested_at: new Date().toISOString() })
      toast.success(t('deleteSuccess'))
    } catch {
      toast.error(t('deleteError'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const result = await cancelAccountDeletion()
      if (!result.success) {
        toast.error(result.error ?? 'Failed to cancel request')
        return
      }
      setPendingRequest(null)
      setSubmitted(false)
      toast.success('Deletion request cancelled')
      router.refresh()
    } catch {
      toast.error('Failed to cancel request')
    } finally {
      setCancelling(false)
    }
  }

  // Compute deadline date
  const deadline = pendingRequest
    ? new Date(
        new Date(pendingRequest.requested_at).getTime() + DEADLINE_DAYS * 24 * 60 * 60 * 1000
      ).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // Show pending/processing state with timeline
  if (pendingRequest || submitted) {
    const currentStatus = pendingRequest?.status ?? 'pending'
    const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.key === currentStatus)
    const canCancel = currentStatus === 'pending'

    return (
      <div className="rounded-xl border border-amber-800/40 bg-amber-950/10 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <h3 className="font-semibold text-amber-400">{t('deleteSubmittedTitle')}</h3>
              <p className="mt-0.5 text-sm text-amber-300/70">{t('deleteSubmittedDescription')}</p>
              {deadline && (
                <p className="mt-1 text-xs text-amber-600">
                  Legal deadline:{' '}
                  <span className="text-amber-500" suppressHydrationWarning>
                    {deadline}
                  </span>
                </p>
              )}
            </div>
          </div>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Cancel request
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-4 flex items-start gap-0">
          {TIMELINE_STEPS.map((step, idx) => {
            const done = currentStepIdx >= idx
            const isCurrent = currentStepIdx === idx
            const isLast = idx === TIMELINE_STEPS.length - 1
            const Icon = step.icon

            return (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* Left connector */}
                  {idx > 0 && (
                    <div
                      className={`h-0.5 flex-1 ${currentStepIdx > idx - 1 ? 'bg-amber-700/60' : 'bg-zinc-800'}`}
                    />
                  )}
                  {/* Step dot */}
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      done
                        ? 'border-amber-600 bg-amber-600/20 text-amber-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-600'
                    } ${isCurrent ? 'ring-2 ring-amber-500/30' : ''}`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${isCurrent && step.key === 'processing' ? 'animate-spin' : ''}`}
                    />
                  </div>
                  {/* Right connector */}
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 ${currentStepIdx > idx ? 'bg-amber-700/60' : 'bg-zinc-800'}`}
                    />
                  )}
                </div>
                <p
                  className={`mt-1.5 text-center text-xs ${done ? 'text-amber-500' : 'text-zinc-700'}`}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Default: no pending request — show delete flow
  return (
    <div className="rounded-xl border border-red-900/40 bg-white/[0.02] p-6 backdrop-blur-sm">
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
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
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
