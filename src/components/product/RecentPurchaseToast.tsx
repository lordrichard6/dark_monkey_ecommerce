'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RecentPurchase = {
    location: string | null
    purchased_at: string
}

type RecentPurchaseToastProps = {
    productId: string
}

export function RecentPurchaseToast({ productId }: RecentPurchaseToastProps) {
    const [recentPurchase, setRecentPurchase] = useState<RecentPurchase | null>(null)
    const [show, setShow] = useState(false)

    useEffect(() => {
        const supabase = createClient()

        // Fetch most recent purchase
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('recent_purchases')
                .select('location, purchased_at')
                .eq('product_id', productId)
                .order('purchased_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setRecentPurchase(data)
                setShow(true)

                // Hide after 5 seconds
                setTimeout(() => setShow(false), 5000)
            }
        }

        fetchRecent()

        // Subscribe to new purchases
        const channel = supabase
            .channel('purchase-toasts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'recent_purchases',
                    filter: `product_id=eq.${productId}`,
                },
                (payload) => {
                    const newPurchase = payload.new as RecentPurchase
                    setRecentPurchase(newPurchase)
                    setShow(true)

                    // Hide after 5 seconds
                    setTimeout(() => setShow(false), 5000)
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [productId])

    if (!show || !recentPurchase) {
        return null
    }

    const timeAgo = getTimeAgo(recentPurchase.purchased_at)
    const location = recentPurchase.location || 'Someone'

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 shadow-lg max-w-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                        {location === 'Someone' ? 'Someone' : `Someone in ${location}`}
                    </p>
                    <p className="text-xs text-neutral-400">
                        purchased this {timeAgo}
                    </p>
                </div>
            </div>
        </div>
    )
}

function getTimeAgo(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`

    return 'today'
}
