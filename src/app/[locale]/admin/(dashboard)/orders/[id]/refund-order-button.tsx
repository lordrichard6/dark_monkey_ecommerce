'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { refundOrder } from '@/actions/admin-orders'

type Props = { orderId: string }

export function RefundOrderButton({ orderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function handleRefund() {
    setError(null)
    if (!confirming) {
      setConfirming(true)
      return
    }
    setLoading(true)
    const result = await refundOrder(orderId)
    setLoading(false)
    setConfirming(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  function handleCancel() {
    setConfirming(false)
    setError(null)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Refund this order in Stripe?</span>
          <button
            type="button"
            onClick={handleRefund}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? 'Refunding...' : 'Yes, refund'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRefund}
          className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-900/50"
        >
          Refund order
        </button>
      )}
    </div>
  )
}
