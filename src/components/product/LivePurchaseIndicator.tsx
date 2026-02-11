'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users } from 'lucide-react'

type LiveIndicatorProps = {
    productId: string
    className?: string
}

export function LivePurchaseIndicator({ productId, className = '' }: LiveIndicatorProps) {
    const [count, setCount] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        // Fetch initial count (last 24 hours)
        const fetchCount = async () => {
            const twentyFourHoursAgo = new Date()
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

            const { count: initialCount } = await supabase
                .from('recent_purchases')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', productId)
                .gte('purchased_at', twentyFourHoursAgo.toISOString())

            setCount(initialCount || 0)
            setIsLoading(false)
        }

        fetchCount()

        // Subscribe to real-time updates
        const channel = supabase
            .channel('purchase-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'recent_purchases',
                    filter: `product_id=eq.${productId}`,
                },
                () => {
                    // Increment count when new purchase detected
                    setCount((prev) => (prev !== null ? prev + 1 : 1))
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [productId])

    // Don't show if loading or no purchases
    if (isLoading || count === null || count === 0) {
        return null
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 ${className}`}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
                {count} {count === 1 ? 'person' : 'people'} bought this today
            </span>
        </div>
    )
}
