'use client'

import { useState, useTransition } from 'react'
import { sendVariantRestockNotifications } from '@/actions/admin-stock-notifications'
import { Bell } from 'lucide-react'

type Props = {
  variantId: string
  productName: string
  productSlug: string
  count: number
}

export function NotifyRestockButton({ variantId, productName, productSlug, count }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ sent: number } | { error: string } | null>(null)

  function handleClick() {
    startTransition(async () => {
      const res = await sendVariantRestockNotifications(variantId, productName, productSlug)
      if (res.error) {
        setResult({ error: res.error })
      } else {
        setResult({ sent: res.sent })
      }
    })
  }

  if (result && 'sent' in result) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
        ✓ Sent to {result.sent} customer{result.sent !== 1 ? 's' : ''}
      </span>
    )
  }

  if (result && 'error' in result) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
        Error: {result.error}
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || count === 0}
      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
    >
      <Bell className="h-3.5 w-3.5" />
      {isPending ? 'Sending…' : `Notify ${count}`}
    </button>
  )
}
