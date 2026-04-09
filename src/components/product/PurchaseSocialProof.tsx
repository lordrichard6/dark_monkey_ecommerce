'use client'

/**
 * Combines LivePurchaseIndicator + RecentPurchaseToast into a single component
 * that opens exactly ONE Supabase Realtime channel per product page.
 */

import { useEffect, useState } from 'react'
import { usePurchaseChannel } from '@/hooks/usePurchaseChannel'
import { Users } from 'lucide-react'

interface Props {
  productId: string
}

export function PurchaseSocialProof({ productId }: Props) {
  const { count, isLoading, latest } = usePurchaseChannel(productId)
  const [showToast, setShowToast] = useState(false)
  const [toastPurchase, setToastPurchase] = useState<typeof latest>(null)

  // Show toast whenever a new (or initial) purchase is received
  useEffect(() => {
    if (!latest) return
    setToastPurchase(latest)
    setShowToast(true)
    const timer = setTimeout(() => setShowToast(false), 5000)
    return () => clearTimeout(timer)
  }, [latest])

  return (
    <>
      {/* Live count badge */}
      {!isLoading && count !== null && count > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <Users className="w-4 h-4 text-green-400" strokeWidth={1.5} />
          <span className="text-sm text-green-400 font-medium">
            {count} {count === 1 ? 'person' : 'people'} bought this today
          </span>
        </div>
      )}

      {/* Purchase toast */}
      {showToast && toastPurchase && (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 shadow-lg max-w-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">
                {toastPurchase.location ? `Someone in ${toastPurchase.location}` : 'Someone'}
              </p>
              <p className="text-xs text-neutral-400">
                purchased this {getTimeAgo(toastPurchase.purchased_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
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
