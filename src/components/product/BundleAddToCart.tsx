'use client'

import { useState } from 'react'
import { addToCart } from '@/actions/cart'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { ShoppingCart } from 'lucide-react'

interface BundleItem {
  productId: string
  productSlug: string
  productName: string
  variantId: string
  variantName: string | null
  priceCents: number
  imageUrl?: string
}

interface BundleAddToCartProps {
  items: BundleItem[]
  totalCents: number
  originalTotalCents?: number
  discountPercentage?: number
}

export function BundleAddToCart({
  items,
  totalCents,
  originalTotalCents,
  discountPercentage,
}: BundleAddToCartProps) {
  const t = useTranslations('product')
  const { format } = useCurrency()
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleAddAll() {
    if (isAdding || items.length === 0) return
    setIsAdding(true)
    try {
      // Add each item sequentially
      for (const item of items) {
        await addToCart({
          variantId: item.variantId,
          productId: item.productId,
          productSlug: item.productSlug,
          productName: item.productName,
          variantName: item.variantName,
          priceCents: item.priceCents,
          quantity: 1,
          imageUrl: item.imageUrl,
        })
      }
      setAdded(true)
      // Reset after 3s
      setTimeout(() => setAdded(false), 3000)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl bg-white/5 p-6 md:mt-0">
      <div className="text-sm text-zinc-400">{t('bundleTotal')}</div>
      {originalTotalCents && originalTotalCents > totalCents && (
        <div className="mt-0.5 text-sm text-zinc-500 line-through">
          {format(originalTotalCents)}
        </div>
      )}
      <div className="mt-1 text-2xl font-bold text-white">{format(totalCents)}</div>
      {discountPercentage && discountPercentage > 0 && (
        <div className="mt-0.5 text-xs font-bold text-amber-500 uppercase tracking-widest">
          {discountPercentage}% {t('saveAmount')}
        </div>
      )}
      <button
        onClick={handleAddAll}
        disabled={isAdding || items.length === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        <ShoppingCart className="h-4 w-4" />
        {isAdding ? t('adding') : added ? t('addedToCart') : t('addAllToCart')}
      </button>
    </div>
  )
}
