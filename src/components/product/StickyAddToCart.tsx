'use client'

import { useState, useEffect, useRef, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { ShoppingCart, Check } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'

type StickyAddToCartProps = {
  productName: string
  priceCents: number
  compareAtPriceCents?: number | null
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
  compareAtPriceCents,
  imageUrl,
  stock,
  quantity = 1,
  onAddToCart,
  observeRef,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const t = useTranslations('product')
  const { format } = useCurrency()
  const scrollFallbackRef = useRef(false)
  const isSale = compareAtPriceCents && compareAtPriceCents > priceCents

  useEffect(() => {
    if (observeRef) {
      const target = observeRef.current
      if (!target) return
      const observer = new IntersectionObserver(([entry]) => setIsVisible(!entry.isIntersecting), {
        threshold: 0,
        rootMargin: '0px',
      })
      observer.observe(target)
      return () => observer.disconnect()
    }
    scrollFallbackRef.current = true
    const handleScroll = () => setIsVisible(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [observeRef])

  if (!isVisible) return null

  const handleClick = async () => {
    if (stock === 0) return
    if (onAddToCart) {
      setIsAdding(true)
      try {
        const ok = await onAddToCart()
        if (ok) {
          setIsSuccess(true)
          setTimeout(() => setIsSuccess(false), 1500)
        }
      } finally {
        setIsAdding(false)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const buttonLabel = () => {
    if (stock === 0) return t('outOfStock')
    if (isAdding) return t('adding')
    if (isSuccess) return t('added')
    if (quantity > 1) return t('addQuantityToCart', { count: quantity })
    return t('addToCart')
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t border-white/5 bg-zinc-950/90 px-4 py-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-3">
        {/* Product thumbnail */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10">
          <ProductImageWithFallback
            src={imageUrl}
            alt={productName}
            fill
            className="object-cover"
            sizes="44px"
          />
        </div>

        {/* Name + price */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-zinc-300">{productName}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-black text-amber-400">
              {format(priceCents * quantity)}
            </span>
            {quantity > 1 && <span className="text-[10px] text-zinc-500">×{quantity}</span>}
            {isSale && (
              <span className="text-[10px] text-zinc-600 line-through">
                {format(compareAtPriceCents)}
              </span>
            )}
          </div>
        </div>

        {/* CTA — pill matching the main Add to Cart button */}
        <button
          onClick={handleClick}
          disabled={stock === 0 || isAdding}
          className={`group flex h-11 shrink-0 items-center justify-between gap-2 rounded-full py-1.5 pl-5 pr-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 disabled:opacity-40 ${
            isSuccess
              ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.25)]'
              : stock === 0
                ? 'bg-zinc-800 text-zinc-500'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
          }`}
        >
          <span>{buttonLabel()}</span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${isSuccess ? 'bg-white/20' : 'bg-black/15'}`}
          >
            {isSuccess ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
