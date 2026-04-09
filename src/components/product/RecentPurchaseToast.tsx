'use client'

import { useEffect, useState } from 'react'
import { usePurchaseChannel } from '@/hooks/usePurchaseChannel'

type RecentPurchaseToastProps = {
  productId: string
}

export function RecentPurchaseToast({ productId }: RecentPurchaseToastProps) {
  const { latest } = usePurchaseChannel(productId)
  const [show, setShow] = useState(false)
  const [displayed, setDisplayed] = useState<typeof latest>(null)

  useEffect(() => {
    if (!latest) return
    setDisplayed(latest)
    setShow(true)
    const timer = setTimeout(() => setShow(false), 5000)
    return () => clearTimeout(timer)
  }, [latest])

  if (!show || !displayed) return null

  const timeAgo = getTimeAgo(displayed.purchased_at)
  const location = displayed.location || null

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 shadow-lg max-w-sm">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm text-white font-medium">
            {location ? `Someone in ${location}` : 'Someone'}
          </p>
          <p className="text-xs text-neutral-400">purchased this {timeAgo}</p>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins === 1) return '1 minute ago'
  if (diffMins < 60) return `${diffMins} minutes ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  return 'today'
}
