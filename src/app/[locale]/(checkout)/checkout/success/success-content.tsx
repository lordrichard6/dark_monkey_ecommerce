'use client'

import { useEffect, useState, useTransition } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, RefreshCcw, ShoppingBag } from 'lucide-react'
import { syncStripeOrder } from '@/actions/sync-order'
import { checkOrderStatus } from '@/actions/check-order'
import { toast } from 'sonner'

type Props = {
    sessionId: string
    initialOrder: { id: string, status: string } | null
}

export function SuccessContent({ sessionId, initialOrder }: Props) {
    const t = useTranslations('checkout')
    const [order, setOrder] = useState(initialOrder)
    const [isPolling, setIsPolling] = useState(!initialOrder)
    const [attempts, setAttempts] = useState(0)
    const [isSyncing, startSync] = useTransition()

    useEffect(() => {
        if (!isPolling) return

        // const supabase = createClient()
        const maxAttempts = 20 // ~40 seconds

        const interval = setInterval(async () => {
            setAttempts(prev => {
                const next = prev + 1
                if (next >= maxAttempts) {
                    setIsPolling(false)
                    clearInterval(interval)
                }
                return next
            })

            const status = await checkOrderStatus(sessionId)

            if (status.ok && status.order) {
                setOrder(status.order as any)
                setIsPolling(false)
                clearInterval(interval)
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [isPolling, sessionId])

    const handleManualSync = () => {
        startSync(async () => {
            const result = await syncStripeOrder(sessionId)
            if (result.ok) {
                toast.success('Order synchronized successfully!')
                setOrder({ id: result.orderId!, status: 'paid' })
            } else {
                toast.error('Sync failed: ' + result.error)
            }
        })
    }

    // 1. Success State (Order found)
    if (order) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/50">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <h1 className="mb-4 text-3xl font-bold text-zinc-50">
                    {t('orderConfirmed')}
                </h1>
                <p className="mb-8 text-lg text-zinc-400">
                    {t('thankYou')}
                    <span className="block mt-2 font-mono text-zinc-500 text-sm">
                        Order #{order.id.split('-')[0].toUpperCase()}
                    </span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/account/orders"
                        className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        View My Orders
                    </Link>
                    <Link
                        href="/products"
                        className="rounded-lg border border-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-900"
                    >
                        {t('continueShopping')}
                    </Link>
                </div>
            </div>
        )
    }

    // 2. Polling / Finalizing State
    if (isPolling) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-24 text-center">
                <div className="mb-8 flex justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                </div>
                <h1 className="mb-4 text-2xl font-bold text-zinc-50">
                    {t('orderFinalizing')}
                </h1>
                <p className="text-zinc-400">
                    {t('orderWait')}
                </p>
            </div>
        )
    }

    // 3. Timeout / Potential Error State
    return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-900/50">
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-zinc-50">
                Taking a little longer than expected...
            </h1>
            <p className="mb-8 text-zinc-400">
                We've confirmed your payment, but our synchronization is taking extra time.
                You can wait, refresh, or try a manual synchronization below.
            </p>
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 rounded-lg bg-zinc-100 px-8 py-3 text-sm font-bold text-zinc-950 transition hover:bg-white disabled:opacity-50"
                >
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Verify Payment Status
                </button>

                <div className="flex gap-4 mt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-zinc-500 hover:text-zinc-300 underline"
                    >
                        Refresh Page
                    </button>
                    <Link href="/contact" className="text-sm text-zinc-500 hover:text-zinc-300 underline">
                        Need help? Contact support
                    </Link>
                </div>
            </div>
        </div>
    )
}
