'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus } from '@/actions/admin-orders'
import { toast } from 'sonner'

const STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

type Props = { orderId: string; currentStatus: string }

export function UpdateOrderStatusForm({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await updateOrderStatus(orderId, status)
    setLoading(false)
    if (result.ok) {
      toast.success(`Status updated to "${status}"`)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to update status')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:border-amber-500/60 focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || status === currentStatus}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Update'}
      </button>
    </form>
  )
}
