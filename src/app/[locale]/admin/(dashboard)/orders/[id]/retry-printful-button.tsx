'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { retryPrintfulFulfillment } from '@/actions/admin-orders'
import { toast } from 'sonner'

type Props = { orderId: string }

export function RetryPrintfulButton({ orderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    setLoading(true)
    const result = await retryPrintfulFulfillment(orderId)
    setLoading(false)

    if (result.ok) {
      toast.success(`Printful order created (#${result.printfulOrderId})`)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to create Printful order', { duration: 8000 })
    }
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600/50 bg-blue-950/30 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-900/40 transition-colors disabled:opacity-50"
    >
      <svg
        className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? 'Sending to Printful…' : 'Retry Printful'}
    </button>
  )
}
