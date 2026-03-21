'use client'

import { useState } from 'react'
import { sendTestEmail, type EmailTestType } from '@/actions/test-emails'
import { toast } from 'sonner'
import {
  Mail,
  Loader2,
  ShoppingBag,
  ShoppingCart,
  RefreshCcw,
  Heart,
  Globe,
  Truck,
  XCircle,
  Star,
  KeyRound,
  UserCheck,
} from 'lucide-react'

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
]

export function EmailTester() {
  const [email, setEmail] = useState('')
  const [locale, setLocale] = useState('en')
  const [loading, setLoading] = useState<EmailTestType | null>(null)

  async function handleSend(type: EmailTestType) {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(type)
    try {
      const res = await sendTestEmail(type, email, locale)
      if (res.ok) {
        toast.success(`Sent ${type} email to ${email} (${locale})`)
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
        <p className="text-sm text-zinc-400">
          Send mock transactional emails to verify Resend configuration and templates.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="test-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Recipient Email
            </label>
            <input
              id="test-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="w-full sm:w-40">
            <label htmlFor="test-locale" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Language
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <select
                id="test-locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-2">
          <button
            onClick={() => handleSend('order')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'order' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
            )}
            Order Confirm
          </button>

          <button
            onClick={() => handleSend('cancellation')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'cancellation' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            Cancellation
          </button>

          <button
            onClick={() => handleSend('shipment')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'shipment' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4 text-sky-500" />
            )}
            Shipment
          </button>

          <button
            onClick={() => handleSend('abandoned-cart')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'abandoned-cart' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4 text-amber-500" />
            )}
            Abandoned Cart
          </button>

          <button
            onClick={() => handleSend('review-request')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'review-request' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4 text-yellow-500" />
            )}
            Review Request
          </button>

          <button
            onClick={() => handleSend('restock')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'restock' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 text-blue-500" />
            )}
            Restock Alert
          </button>

          <button
            onClick={() => handleSend('wishlist')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'wishlist' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4 text-pink-500" />
            )}
            Wishlist Reminder
          </button>

          <button
            onClick={() => handleSend('welcome')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'welcome' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 text-violet-500" />
            )}
            Welcome
          </button>

          <button
            onClick={() => handleSend('email-confirmation')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'email-confirmation' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 text-teal-500" />
            )}
            Confirmation
          </button>

          <button
            onClick={() => handleSend('password-reset')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading === 'password-reset' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4 text-orange-500" />
            )}
            Password Reset
          </button>
        </div>
      </div>
    </div>
  )
}
