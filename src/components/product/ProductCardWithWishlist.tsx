'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { ProductName } from './ProductName'
import { ProductBadge } from './ProductBadge'
import { QuickViewModal } from './QuickViewModal'

type ProductCardProps = {
  slug: string
  productId: string
  name: string
  priceCents: number
  compareAtPriceCents?: number | null
  imageUrl: string
  imageAlt: string
  imageUrl2?: string | null
  dualImageMode?: boolean
  isInWishlist?: boolean
  isBestseller?: boolean
  isFeatured?: boolean
  isOnSale?: boolean
  createdAt?: string
  showWishlist?: boolean
}

import { useCurrency } from '@/components/currency/CurrencyContext'
import { useTranslations } from 'next-intl'

export function ProductCardWithWishlist({
  slug,
  productId,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  imageAlt,
  imageUrl2,
  dualImageMode = false,
  isInWishlist = false,
  isBestseller = false,
  isFeatured = false,
  isOnSale = false,
  createdAt,
  showWishlist = true,
}: ProductCardProps) {
  const { format } = useCurrency()
  const t = useTranslations('product')

  // Check if product is new (created within last 3 days)
  const isNew = createdAt
    ? new Date().getTime() - new Date(createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
    : false

  // Determine which badges to show (priority: Sale > New > Featured > Bestseller)
  const badges = []
  if (isOnSale) badges.push('sale')
  if (isNew) badges.push('new')
  if (isFeatured) badges.push('featured')
  if (isBestseller) badges.push('bestseller')

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const showDual = dualImageMode && !!imageUrl2

  const unoptimizedFor = (url: string) =>
    url.endsWith('.svg') || url.includes('picsum.photos') || url.includes('placehold.co')

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20 h-full">
        <Link href={`/products/${slug}`} className="flex flex-col flex-1">
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
            {/* Display badges */}
            {badges.length > 0 && (
              <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                {badges.map((badge) => (
                  <ProductBadge
                    key={badge}
                    type={badge as 'new' | 'featured' | 'sale' | 'bestseller'}
                  />
                ))}
              </div>
            )}

            {showDual ? (
              /* ── Dual-image diagonal cut ── */
              <>
                {/* Image 1: left half — fills only left half so object-center works correctly */}
                <div
                  className="absolute inset-y-0 left-0 w-1/2 transition group-hover:scale-105"
                  style={{ clipPath: 'polygon(0 0, 124% 0, 76% 100%, 0 100%)' }}
                >
                  <ProductImageWithFallback
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 15vw, (max-width: 1024px) 10vw, 8vw"
                    unoptimized={unoptimizedFor(imageUrl)}
                  />
                </div>
                {/* Image 2: right half — fills only right half so object-center works correctly */}
                <div
                  className="absolute inset-y-0 right-0 w-1/2 transition group-hover:scale-105"
                  style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, -24% 100%)' }}
                >
                  <ProductImageWithFallback
                    src={imageUrl2!}
                    alt={imageAlt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 15vw, (max-width: 1024px) 10vw, 8vw"
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
                    <filter id="slash-glow-wl" x="-50%" y="-10%" width="200%" height="120%">
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
                    filter="url(#slash-glow-wl)"
                  />
                </svg>
              </>
            ) : (
              /* ── Single image (default) ── */
              <ProductImageWithFallback
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover object-center transition group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized={unoptimizedFor(imageUrl)}
              />
            )}

            {showWishlist && (
              <WishlistButton
                productId={productId}
                productSlug={slug}
                isInWishlist={isInWishlist}
                variant="icon"
              />
            )}

            {/* Quick View Button Overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full p-4 transition-transform group-hover:translate-y-0 hidden md:block">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsQuickViewOpen(true)
                }}
                className="w-full rounded-lg bg-white/95 py-2.5 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm hover:bg-white transition-colors"
              >
                {t('quickView')}
              </button>
            </div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <ProductName name={name} />
            <div className="mt-auto pt-2 flex flex-wrap items-baseline gap-1">
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
