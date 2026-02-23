'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmOrderWithPrintful } from '@/actions/admin-orders-sync'
import { toast } from 'sonner'

type Props = { orderId: string }

export function ConfirmPrintfulOrderButton({ orderId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await confirmOrderWithPrintful(orderId)
    setLoading(false)
    setConfirming(false)

    if (result.ok) {
      toast.success(
        `Order confirmed with Printful${result.printfulStatus ? ` — status: ${result.printfulStatus}` : ''}. Local status set to Processing.`
      )
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to confirm with Printful', { duration: 8000 })
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-700/50 bg-amber-950/30 px-3 py-2">
        <svg
          className="h-3.5 w-3.5 shrink-0 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-xs text-amber-300">This commits to real fulfillment costs.</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Confirming…' : 'Yes, confirm'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
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
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition-colors"
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Confirm with Printful
    </button>
  )
}
