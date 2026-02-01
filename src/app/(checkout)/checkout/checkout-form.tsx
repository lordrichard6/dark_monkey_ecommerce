'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createCheckoutSession } from '@/actions/checkout'
import type { CartItem } from '@/types/cart'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

type CheckoutFormProps = {
  items: CartItem[]
  totalCents: number
  defaultEmail?: string
  stripeConfigured: boolean
}

export function CheckoutForm({
  items,
  totalCents,
  defaultEmail = '',
  stripeConfigured,
}: CheckoutFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    const result = await createCheckoutSession({
      email: email.trim(),
      fullName: '',
      line1: '',
      city: '',
      postalCode: '',
      country: 'PT',
    })

    setLoading(false)

    if (result.ok) {
      window.location.href = result.url
      return
    }

    switch (result.error) {
      case 'STRIPE_NOT_CONFIGURED':
        setError('Payments are not configured yet. Please try again later.')
        break
      case 'CART_EMPTY':
        router.push('/')
        break
      case 'VALIDATION_FAILED':
        setError('message' in result ? result.message : 'Validation failed')
        router.refresh()
        break
      default:
        setError(result.error ?? 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          Contact
        </h2>
        <label htmlFor="email" className="block text-sm text-zinc-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="you@example.com"
        />
        <p className="mt-2 text-sm text-zinc-500">
          Shipping address will be collected on the payment page.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          Order summary
        </h2>
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {items.map((item, idx) => (
            <li
              key={`${item.variantId}-${idx}-${JSON.stringify(item.config ?? {})}`}
              className="flex gap-4 p-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-900">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized={item.imageUrl?.endsWith('.svg') || item.imageUrl?.includes('picsum.photos')}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-50">{item.productName}</p>
                {item.variantName && (
                  <p className="text-sm text-zinc-500">{item.variantName}</p>
                )}
                {item.config && Object.keys(item.config).length > 0 && (
                  <p className="text-xs text-amber-400/90">
                    Custom: {Object.entries(item.config).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </p>
                )}
                <p className="text-sm text-zinc-400">
                  Qty: {item.quantity} × {formatPrice(item.priceCents)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-zinc-50">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between text-lg font-semibold text-zinc-50">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Link
          href="/"
          className="flex-1 rounded-lg border border-zinc-600 py-3 text-center text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
        >
          Continue shopping
        </Link>
        <button
          type="submit"
          disabled={loading || !stripeConfigured}
          className="flex-1 rounded-lg bg-white py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Redirecting...' : stripeConfigured ? 'Pay with Stripe' : 'Configure Stripe to enable'}
        </button>
      </div>
    </form>
  )
}
