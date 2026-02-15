'use client'

import { useState } from 'react'
import { syncPrintfulProducts } from '@/actions/sync-printful'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PackagePlus, Loader2 } from 'lucide-react'

export function FetchLatestProductButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleFetchLatest() {
        setLoading(true)
        try {
            const result = await syncPrintfulProducts(false, true)

            if (result.ok) {
                if (result.synced && result.synced > 0) {
                    toast.success(`Synced the latest product from Printful`)
                    router.refresh()
                } else {
                    toast.info(result.error ?? 'No new items found on Printful')
                }
            } else {
                toast.error(result.error ?? 'Sync failed')
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to fetch latest product')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleFetchLatest}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500 transition-all disabled:opacity-50"
            title="Fetch the very latest published product from Printful"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <PackagePlus className="h-4 w-4" />
            )}
            {loading ? 'Fetching...' : 'Fetch Latest Published'}
        </button>
    )
}
