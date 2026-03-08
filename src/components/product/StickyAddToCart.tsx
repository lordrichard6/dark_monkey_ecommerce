'use client'

import { useState, useEffect, useRef, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { ShoppingCart } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'

type StickyAddToCartProps = {
  productName: string
  priceCents: number
  imageUrl: string
  stock: number
  quantity?: number
  onAddToCart?: () => Promise<boolean>
  /** Ref to the main add-to-cart form. When it leaves the viewport the sticky bar appears. */
  observeRef?: RefObject<HTMLElement | null>
}

export function StickyAddToCart({
  productName,
  priceCents,
  imageUrl,
  stock,
  quantity = 1,
  onAddToCart,
  observeRef,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const t = useTranslations('product')
  const { format } = useCurrency()
  const scrollFallbackRef = useRef(false)

  useEffect(() => {
    // Prefer Intersection Observer when a target ref is provided
    if (observeRef) {
      const target = observeRef.current
      if (!target) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          // Show sticky bar when the main form is NOT intersecting (scrolled past it)
          setIsVisible(!entry.isIntersecting)
        },
        { threshold: 0, rootMargin: '0px' }
      )
      observer.observe(target)
      return () => observer.disconnect()
    }

    // Fallback: scroll listener
    scrollFallbackRef.current = true
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [observeRef])

  if (!isVisible) return null

  const handleClick = async () => {
    if (stock === 0) return
    if (onAddToCart) {
      setIsAdding(true)
      try {
        await onAddToCart()
      } finally {
        setIsAdding(false)
      }
    } else {
      // Fallback: scroll up to the product form so user can add from there
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t border-zinc-700 bg-zinc-900/95 p-4 backdrop-blur-md transition-transform md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-700">
            <ProductImageWithFallback
              src={imageUrl}
              alt={productName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="truncate">
            <p className="truncate text-sm font-semibold text-white">{productName}</p>
            <p className="text-sm font-medium text-amber-400">
              {format(priceCents * quantity)}
              {quantity > 1 && <span className="ml-1 text-xs text-zinc-500">×{quantity}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={stock === 0 || isAdding}
          className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {stock === 0 ? t('outOfStock') : isAdding ? t('adding') : t('addToCart')}
        </button>
      </div>
    </div>
  )
}
