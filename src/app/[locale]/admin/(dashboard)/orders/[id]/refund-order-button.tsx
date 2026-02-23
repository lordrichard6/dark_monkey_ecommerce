'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { refundOrder } from '@/actions/admin-orders'
import { toast } from 'sonner'

type Props = { orderId: string }

export function RefundOrderButton({ orderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleRefund() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setLoading(true)
    const result = await refundOrder(orderId)
    setLoading(false)
    setConfirming(false)
    if (result.ok) {
      toast.success('Order refunded successfully')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to process refund')
    }
  }

  function handleCancel() {
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/30 px-3 py-2">
        <span className="text-xs text-red-300">Refund via Stripe?</span>
        <button
          type="button"
          onClick={handleRefund}
          disabled={loading}
          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Refunding…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleRefund}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40 transition-colors"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
      Refund
    </button>
  )
}
