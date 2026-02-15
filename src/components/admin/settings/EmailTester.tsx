'use client'

import { useState } from 'react'
import { sendTestEmail, type EmailTestType } from '@/actions/test-emails'
import { toast } from 'sonner'
import { Mail, Loader2, ShoppingBag, ShoppingCart, RefreshCcw, Heart } from 'lucide-react'

export function EmailTester() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState<EmailTestType | null>(null)

    async function handleSend(type: EmailTestType) {
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address')
            return
        }

        setLoading(type)
        try {
            const res = await sendTestEmail(type, email)
            if (res.ok) {
                toast.success(`Sent ${type} email to ${email}`)
            } else {
                toast.error(res.error || 'Failed to send email')
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
            console.error(err)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <div className="mb-6 space-y-1">
                <h3 className="text-lg font-medium text-white">Email Testing</h3>
                <p className="text-sm text-zinc-400">Send mock transactional emails to verify Resend configuration.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="test-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Recipient Email
                    </label>
                    <input
                        id="test-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                        onClick={() => handleSend('order')}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        {loading === 'order' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4 text-emerald-500" />}
                        Order Confirm
                    </button>

                    <button
                        onClick={() => handleSend('abandoned-cart')}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        {loading === 'abandoned-cart' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4 text-amber-500" />}
                        Abandoned Cart
                    </button>

                    <button
                        onClick={() => handleSend('restock')}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        {loading === 'restock' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 text-blue-500" />}
                        Restock Alert
                    </button>

                    <button
                        onClick={() => handleSend('wishlist')}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        {loading === 'wishlist' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 text-pink-500" />}
                        Wishlist Reminder
                    </button>
                </div>
            </div>
        </div>
    )
}
