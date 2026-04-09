'use client'

import { usePurchaseChannel } from '@/hooks/usePurchaseChannel'
import { Users } from 'lucide-react'

type LiveIndicatorProps = {
  productId: string
  className?: string
}

export function LivePurchaseIndicator({ productId, className = '' }: LiveIndicatorProps) {
  const { count, isLoading } = usePurchaseChannel(productId)

  if (isLoading || count === null || count === 0) return null

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <Users className="w-4 h-4 text-green-400" strokeWidth={1.5} />
      <span className="text-sm text-green-400 font-medium">
        {count} {count === 1 ? 'person' : 'people'} bought this today
      </span>
    </div>
  )
}
