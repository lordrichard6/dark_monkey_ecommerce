'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCheckoutSession, validateDiscountCode } from '@/actions/checkout'
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
  const t = useTranslations('checkout')
  const tAuth = useTranslations('auth')
  const tCart = useTranslations('cart')
  const [email, setEmail] = useState(defaultEmail)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApplyDiscount(e: React.FormEvent) {
    e.preventDefault()
    setDiscountError(null)
    setAppliedDiscount(null)
    const code = discountCode.trim()
    if (!code) return
    const result = await validateDiscountCode(code, totalCents)
    if (result.ok) {
      setAppliedDiscount({ code: result.code, discountCents: result.discountCents })
    } else {
      setDiscountError(result.error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim()) {
      setError(t('emailRequired'))
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
      discountCode: appliedDiscount ? appliedDiscount.code : discountCode.trim() || undefined,
    })

    setLoading(false)

    if (result.ok) {
      window.location.href = result.url
      return
    }

    switch (result.error) {
      case 'STRIPE_NOT_CONFIGURED':
        setError(t('paymentsNotConfigured'))
        break
      case 'CART_EMPTY':
        router.push('/')
        break
      case 'VALIDATION_FAILED':
        setError('message' in result ? result.message : t('validationFailed'))
        router.refresh()
        break
      default:
        setError(result.error ?? t('validationFailed'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          {t('contact')}
        </h2>
        <label htmlFor="email" className="block text-sm text-zinc-400">
          {t('contact')}
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
          {t('shippingCollected')}
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          {t('discountCode')}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => {
              setDiscountCode(e.target.value.toUpperCase())
              setDiscountError(null)
              setAppliedDiscount(null)
            }}
            placeholder="e.g. SAVE10"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          <button
            type="button"
            onClick={handleApplyDiscount}
            className="rounded-lg border border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            {t('apply')}
          </button>
        </div>
        {discountError && (
          <p className="mt-2 text-sm text-red-400">{discountError}</p>
        )}
        {appliedDiscount && (
          <p className="mt-2 text-sm text-amber-400">
            {t('discountAppliedLabel')}: −{formatPrice(appliedDiscount.discountCents)}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          {t('orderSummary')}
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
                    {tCart('customLabel')}: {Object.entries(item.config).map(([k, v]) => `${k}: ${v}`).join(', ')}
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
          <span>{t('total')}</span>
          <span>
            {formatPrice(
              appliedDiscount ? totalCents - appliedDiscount.discountCents : totalCents
            )}
          </span>
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
          {t('continueShopping')}
        </Link>
        <button
          type="submit"
          disabled={loading || !stripeConfigured}
          className="flex-1 rounded-lg bg-white py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t('redirecting') : stripeConfigured ? t('payWithStripe') : t('configureStripe')}
        </button>
      </div>
    </form>
  )
}
