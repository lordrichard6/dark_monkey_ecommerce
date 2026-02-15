'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

type StockNotificationButtonProps = {
    productId: string
    variantId: string
    productName: string
    variantName: string | null
}

export function StockNotificationButton({
    productId,
    variantId,
    productName,
    variantName
}: StockNotificationButtonProps) {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')
    const t = useTranslations('product')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email || isSubmitting) return

        setIsSubmitting(true)
        setError('')

        try {
            const supabase = createClient()

            // Insert into stock_notifications table
            const { error: dbError } = await supabase
                .from('stock_notifications')
                .insert({
                    product_id: productId,
                    variant_id: variantId,
                    email,
                    product_name: productName,
                    variant_name: variantName,
                    notified: false,
                })

            if (dbError) throw dbError

            setIsSuccess(true)
            setEmail('')

            // Reset success message after 5 seconds
            setTimeout(() => setIsSuccess(false), 5000)
        } catch (err) {
            console.error('Error submitting stock notification:', err)
            setError(t('stockNotificationError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                <Check className="h-4 w-4" />
                {t('stockNotificationSuccess')}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Bell className="h-4 w-4" />
                <span>{t('notifyWhenAvailable')}</span>
            </div>
            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? t('notifying') : t('notifyMe')}
                </button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
    )
}
