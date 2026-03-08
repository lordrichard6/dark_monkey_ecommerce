'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createCheckoutSession, validateDiscountCode } from '@/actions/checkout'
import { getShippingCost } from '@/actions/shipping'
import { addToCart } from '@/actions/cart'
import type { CartItem } from '@/types/cart'
import { trackBeginCheckout, trackAddPaymentInfo } from '@/lib/analytics'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { UpsellSection } from '@/components/checkout/UpsellSection'
import {
  COUNTRY_LABELS,
  ALLOWED_SHIPPING_COUNTRIES,
  FREE_SHIPPING_THRESHOLD_CENTS,
} from '@/lib/shipping'
import { Loader2, Truck } from 'lucide-react'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export type CheckoutUpsellItem = {
  id: string
  variantId: string
  productId: string
  productSlug: string
  name: string
  variantName: string | null
  priceCents: number
  imageUrl: string
  discountPercentage?: number
}

type CheckoutFormProps = {
  items: CartItem[]
  totalCents: number
  defaultEmail?: string
  stripeConfigured: boolean
  initialUpsellItems?: CheckoutUpsellItem[]
}

export function CheckoutForm({
  items,
  totalCents,
  defaultEmail = '',
  stripeConfigured,
  initialUpsellItems = [],
}: CheckoutFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('checkout')
  const tAuth = useTranslations('auth')
  const tCart = useTranslations('cart')
  const { currency } = useCurrency()
  const [email, setEmail] = useState(defaultEmail)
  const [country, setCountry] = useState('')
  const [shippingCents, setShippingCents] = useState(0)
  const [isFreeShipping, setIsFreeShipping] = useState(false)
  const [shippingZoneName, setShippingZoneName] = useState('')
  const [freeShippingRemaining, setFreeShippingRemaining] = useState(0)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    discountCents: number
  } | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [upsellItems, setUpsellItems] = useState<CheckoutUpsellItem[]>(initialUpsellItems)
  const [addingUpsellId, setAddingUpsellId] = useState<string | null>(null)

  // Track begin_checkout on mount
  useEffect(() => {
    trackBeginCheckout({
      total: totalCents,
      currency,
      items: items.map((item) => ({
        id: item.productId,
        name: item.productName,
        price: item.priceCents,
        quantity: item.quantity,
        variant: item.variantName || undefined,
      })),
    })
  }, [items, totalCents, currency])

  const fetchShipping = useCallback(async (countryCode: string) => {
    if (!countryCode) {
      setShippingCents(0)
      setIsFreeShipping(false)
      setShippingZoneName('')
      setFreeShippingRemaining(0)
      return
    }
    setShippingLoading(true)
    const result = await getShippingCost(countryCode)
    setShippingLoading(false)
    if (result.ok) {
      setShippingCents(result.shippingCents)
      setIsFreeShipping(result.isFreeShipping)
      setShippingZoneName(result.zoneName)
      setFreeShippingRemaining(result.freeShippingRemaining)
    }
  }, [])

  function handleCountryChange(value: string) {
    setCountry(value)
    fetchShipping(value)
  }

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

  const discountCents = appliedDiscount?.discountCents ?? 0
  const grandTotal = Math.max(0, totalCents + shippingCents - discountCents)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim()) {
      setError(t('emailRequired'))
      setLoading(false)
      return
    }

    if (!country) {
      setError(t('shippingRequired'))
      setLoading(false)
      return
    }

    const result = await createCheckoutSession({
      email: email.trim(),
      fullName: '',
      line1: '',
      city: '',
      postalCode: '',
      country,
      discountCode: appliedDiscount ? appliedDiscount.code : discountCode.trim() || undefined,
      locale,
    })

    setLoading(false)

    if (result.ok) {
      // Track payment info added
      trackAddPaymentInfo({
        total: grandTotal,
        currency,
      })
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
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('contact')}</h2>
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
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('shippingCountry')}</h2>
        <select
          id="country"
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          required
          className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">{t('selectCountry')}</option>
          {ALLOWED_SHIPPING_COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {COUNTRY_LABELS[code] ?? code}
            </option>
          ))}
        </select>

        {/* Shipping cost preview */}
        {country && !shippingLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-zinc-400" />
            {isFreeShipping ? (
              <span className="font-medium text-green-400">{t('freeShippingUnlocked')}</span>
            ) : (
              <span className="text-zinc-400">
                {t('shipping')}: {formatPrice(shippingCents)}
              </span>
            )}
          </div>
        )}
        {shippingLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>...</span>
          </div>
        )}

        {/* Free shipping nudge */}
        {country && !isFreeShipping && freeShippingRemaining > 0 && !shippingLoading && (
          <p className="mt-2 text-sm text-amber-400/80">
            {t('freeShippingRemaining', { amount: formatPrice(freeShippingRemaining) })}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('discountCode')}</h2>
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
        {discountError && <p className="mt-2 text-sm text-red-400">{discountError}</p>}
        {appliedDiscount && (
          <p className="mt-2 text-sm text-amber-400">
            {t('discountAppliedLabel')}: −{formatPrice(appliedDiscount.discountCents)}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('orderSummary')}</h2>
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
                    unoptimized={
                      item.imageUrl?.endsWith('.svg') || item.imageUrl?.includes('picsum.photos')
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-50">{item.productName}</p>
                {item.variantName && <p className="text-sm text-zinc-500">{item.variantName}</p>}
                {item.config && Object.keys(item.config).length > 0 && (
                  <p className="text-xs text-amber-400/90">
                    {tCart('customLabel')}:{' '}
                    {Object.entries(item.config)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}
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
        {/* Upsell Section */}
        <UpsellSection
          upsellItems={upsellItems}
          onAdd={async (id) => {
            const item = upsellItems.find((u) => u.id === id)
            if (!item || addingUpsellId) return
            setAddingUpsellId(id)
            await addToCart({
              variantId: item.variantId,
              productId: item.productId,
              productSlug: item.productSlug,
              productName: item.name,
              variantName: item.variantName,
              priceCents: item.priceCents,
              quantity: 1,
              imageUrl: item.imageUrl,
            })
            // Remove upsell from list after adding
            setUpsellItems((prev) => prev.filter((u) => u.id !== id))
            setAddingUpsellId(null)
            router.refresh()
          }}
        />

        {/* Price breakdown */}
        <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>{t('subtotal')}</span>
            <span>{formatPrice(totalCents)}</span>
          </div>

          {country && (
            <div className="flex justify-between text-sm text-zinc-400">
              <span>
                {t('shipping')}
                {shippingZoneName ? ` (${shippingZoneName})` : ''}
              </span>
              <span>
                {shippingLoading ? (
                  '...'
                ) : isFreeShipping ? (
                  <span className="text-green-400">{t('shippingFree')}</span>
                ) : (
                  formatPrice(shippingCents)
                )}
              </span>
            </div>
          )}

          {discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>{t('discountAppliedLabel')}</span>
              <span>−{formatPrice(discountCents)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-zinc-800 pt-2 text-lg font-semibold text-zinc-50">
            <span>{t('total')}</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
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
          disabled={loading || !stripeConfigured || !country}
          className="flex-1 rounded-lg bg-white py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? t('redirecting')
            : stripeConfigured
              ? t('payWithStripe')
              : t('configureStripe')}
        </button>
      </div>
    </form>
  )
}
