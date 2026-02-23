'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncOrderStatus } from '@/actions/admin-orders-sync'
import { toast } from 'sonner'

type Props = { orderId: string }

export function SyncPrintfulOrderButton({ orderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    setLoading(true)
    const result = await syncOrderStatus(orderId)
    setLoading(false)

    if (result.ok) {
      const statusLabel = result.printfulStatus ? ` (Printful: ${result.printfulStatus})` : ''

      if (result.updated) {
        const changes = result.updates ? Object.keys(result.updates).join(', ') : 'unknown'
        toast.success(`Synced with Printful — updated: ${changes}${statusLabel}`)
      } else {
        toast.success(`Already up to date${statusLabel}`)
      }
      router.refresh()
    } else {
      // Show a descriptive error that includes what Printful returned
      toast.error(result.error ?? 'Failed to sync with Printful', {
        duration: 6000, // Keep error toasts visible longer
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
      >
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
      {loading ? 'Syncing…' : 'Sync Printful'}
    </button>
  )
}
