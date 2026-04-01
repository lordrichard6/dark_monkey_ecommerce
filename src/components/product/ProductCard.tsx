'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightLeft } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { QuickViewModal } from './QuickViewModal'
import { useCompare } from '@/lib/store/use-compare'
import { Product } from '@/types'
import { useScrollReveal } from '@/hooks/useScrollReveal'

type ProductCardProps = {
  id: string
  slug: string
  name: string
  priceCents: number
  compareAtPriceCents?: number | null
  imageUrl: string
  imageAlt: string
  imageUrl2?: string | null
  dualImageMode?: boolean
  fullProduct?: Product
  /** Grid position index — used to stagger the entrance delay (0-based) */
  index?: number
}

export function ProductCard({
  id,
  slug,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  imageAlt,
  imageUrl2,
  dualImageMode = false,
  fullProduct,
  index = 0,
}: ProductCardProps) {
  const { format } = useCurrency()
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const { addProduct, removeProduct, isInCompare } = useCompare()
  const { ref, visible } = useScrollReveal()
  // Cap stagger at 4 so rows far down don't wait too long
  const delay = Math.min(index % 4, 3) * 80

  const isComparing = isInCompare(id)
  const showDual = dualImageMode && !!imageUrl2

  const unoptimizedFor = (url: string) =>
    url.endsWith('.svg') || url.includes('picsum.photos') || url.includes('placehold.co')

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isComparing) {
      removeProduct(id)
    } else {
      // If we don't have fullProduct, we construct a partial one for the UI
      addProduct(
        fullProduct ||
          ({
            id,
            slug,
            name,
            price_cents: priceCents,
            image_url: imageUrl, // Mapping for comparison UI
          } as unknown as Product)
      )
    }
  }

  return (
    <>
      <div
        ref={ref}
        className="group block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.55s',
          transitionTimingFunction: 'ease',
          transitionDelay: `${delay}ms`,
        }}
      >
        <Link href={`/products/${slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
            {showDual ? (
              <>
                {/* Image 1: full container, clipped to left half by diagonal */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: 'polygon(0 0, 62% 0, 38% 100%, 0 100%)' }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      className="object-cover object-top transition group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      loading="lazy"
                      unoptimized={unoptimizedFor(imageUrl)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                {/* Image 2: full container, clipped to right half by diagonal */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 38% 100%)' }}
                >
                  <Image
                    src={imageUrl2!}
                    alt={imageAlt}
                    fill
                    className="object-cover object-top transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="lazy"
                    unoptimized={unoptimizedFor(imageUrl2!)}
                  />
                </div>
                {/* Diagonal slash — SVG line matching clip-path exactly */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter id="slash-glow-pc" x="-50%" y="-10%" width="200%" height="120%">
                      <feGaussianBlur stdDeviation="1" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <line
                    x1="62"
                    y1="0"
                    x2="38"
                    y2="100"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#slash-glow-pc)"
                  />
                </svg>
              </>
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                loading="lazy"
                unoptimized={unoptimizedFor(imageUrl)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
                <span className="text-xs">No image</span>
              </div>
            )}
            {/* Compare Button */}
            <button
              onClick={toggleCompare}
              className={`absolute top-3 right-3 z-30 flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-full transition-all duration-300 ${
                isComparing
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/40'
                  : 'bg-black/40 text-white backdrop-blur-md hover:bg-black/60 opacity-0 group-hover:opacity-100'
              }`}
              title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
            >
              <ArrowRightLeft
                className={`h-4 w-4 transition-transform ${isComparing ? 'scale-110' : ''}`}
              />
            </button>
            {/* Quick View Button Overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full p-4 transition-transform group-hover:translate-y-0 hidden md:block">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsQuickViewOpen(true)
                }}
                className="w-full rounded-lg bg-white/95 py-2.5 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm hover:bg-white transition-colors"
              >
                Quick View
              </button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] font-medium text-zinc-50 group-hover:text-white">
              {name}
            </h3>
            <div className="mt-2 flex flex-wrap items-baseline gap-1">
              <span
                className={`text-sm font-bold md:text-base ${compareAtPriceCents && compareAtPriceCents > priceCents ? 'text-amber-500' : 'text-zinc-200'}`}
              >
                {format(priceCents || 0)}
              </span>
              {compareAtPriceCents && compareAtPriceCents > priceCents && (
                <span className="text-xs text-zinc-500 line-through decoration-zinc-500/50 md:text-sm">
                  {format(compareAtPriceCents)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      <QuickViewModal
        slug={slug}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  )
}
