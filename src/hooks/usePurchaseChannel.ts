'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type RecentPurchase = {
  id: string
  location: string | null
  purchased_at: string
}

interface PurchaseChannelState {
  count: number | null
  isLoading: boolean
  latest: RecentPurchase | null
}

/**
 * Single shared Supabase channel per productId for purchase social proof.
 * Replaces the two separate subscriptions that LivePurchaseIndicator and
 * RecentPurchaseToast each created independently.
 */
export function usePurchaseChannel(productId: string): PurchaseChannelState {
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [latest, setLatest] = useState<RecentPurchase | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    const since = twentyFourHoursAgo.toISOString()

    // Fetch initial data: count + most recent purchase in one go
    async function fetchInitial() {
      const [countRes, latestRes] = await Promise.all([
        supabase
          .from('recent_purchases')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', productId)
          .gte('purchased_at', since),
        supabase
          .from('recent_purchases')
          .select('id, location, purchased_at')
          .eq('product_id', productId)
          .order('purchased_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return
      setCount(countRes.count ?? 0)
      setLatest(latestRes.data ?? null)
      setIsLoading(false)
    }

    fetchInitial().catch(() => {
      if (!cancelled) setIsLoading(false)
    })

    // ONE channel for both components
    const channel = supabase
      .channel(`purchase-social-proof-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recent_purchases',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          const row = payload.new as RecentPurchase
          setCount((prev) => (prev !== null ? prev + 1 : 1))
          setLatest(row)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      channel.unsubscribe()
    }
  }, [productId])

  return { count, isLoading, latest }
}
