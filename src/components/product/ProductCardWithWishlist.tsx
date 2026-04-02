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
  index?: number
  upvotes?: number
  publicUp?: number
  publicDown?: number
  timesBought?: number
  reviewCount?: number
  avgRating?: number | null
}

import { useCurrency } from '@/components/currency/CurrencyContext'
import { useTranslations } from 'next-intl'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { ProductVoteButtons } from './ProductVoteButtons'
import { ProductCardStats } from './ProductCardStats'
import { AdminEditButton } from './AdminEditButton'

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
  index = 0,
  upvotes = 0,
  publicUp = 0,
  publicDown = 0,
  timesBought = 0,
  reviewCount = 0,
  avgRating = null,
}: ProductCardProps) {
  const { format } = useCurrency()
  const t = useTranslations('product')

  // Check if product is new (created within last 3 days)
  const isNew = createdAt
    ? new Date().getTime() - new Date(createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
    : false

  // Derive sale state directly from prices — never rely solely on the prop
  const actuallyOnSale = isOnSale || !!(compareAtPriceCents && compareAtPriceCents > priceCents)

  // Badge translated labels
  const badgeLabels: Record<string, string> = {
    sale: t('badgeSale'),
    new: t('badgeNew'),
    bestseller: t('badgeBestseller'),
    featured: t('badgeFeatured'),
  }

  // Determine which badges to show (priority: Sale > New > Featured > Bestseller)
  const badges = []
  if (actuallyOnSale) badges.push('sale')
  if (isNew) badges.push('new')
  if (isFeatured) badges.push('featured')
  if (isBestseller) badges.push('bestseller')

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const { ref, visible } = useScrollReveal()
  const delay = Math.min(index % 4, 3) * 80

  const showDual = dualImageMode && !!imageUrl2

  const unoptimizedFor = (url: string) =>
    url.endsWith('.svg') || url.includes('picsum.photos') || url.includes('placehold.co')

  return (
    <>
      <div
        ref={ref}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20 h-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.55s',
          transitionTimingFunction: 'ease',
          transitionDelay: `${delay}ms`,
        }}
      >
        {/* Badges + vote — outside <Link> so button-inside-anchor invalid HTML is avoided.
            pointer-events-none on the wrapper lets clicks on badges fall through to the Link;
            pointer-events-auto on the vote button restores its own interactivity. */}
        <div className="pointer-events-none absolute left-2 top-2 z-30 flex flex-col gap-1">
          {badges.map((badge) => (
            <ProductBadge
              key={badge}
              type={badge as 'new' | 'featured' | 'sale' | 'bestseller'}
              label={badgeLabels[badge]}
            />
          ))}
          <div className="pointer-events-auto">
            <ProductVoteButtons
              productId={productId}
              initialUp={publicUp}
              initialDown={publicDown}
              variant="overlay"
            />
          </div>
        </div>

        <Link href={`/products/${slug}`} className="flex flex-col flex-1">
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
            {showDual ? (
              /* ── Dual-image diagonal cut ── */
              <>
                {/* Image 1: left half — contained so full product is visible */}
                <div
                  className="absolute inset-y-0 left-0 w-1/2"
                  style={{ clipPath: 'polygon(0 0, 124% 0, 76% 100%, 0 100%)' }}
                >
                  <ProductImageWithFallback
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-cover object-center transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={unoptimizedFor(imageUrl)}
                  />
                </div>
                {/* Image 2: right — starts at 38% to fully cover the diagonal triangle */}
                <div
                  className="absolute inset-y-0 right-0"
                  style={{ left: '38%', clipPath: 'polygon(39% 0, 100% 0, 100% 100%, 0% 100%)' }}
                >
                  <ProductImageWithFallback
                    src={imageUrl2!}
                    alt={imageAlt}
                    fill
                    className="object-cover object-center transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
            <div className="mt-auto pt-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span
                  className={`text-base font-extrabold md:text-xl ${compareAtPriceCents && compareAtPriceCents > priceCents ? 'text-amber-400' : 'text-zinc-100'}`}
                >
                  {format(priceCents || 0)}
                </span>
                {compareAtPriceCents && compareAtPriceCents > priceCents && (
                  <span className="text-xs font-medium text-zinc-500 line-through decoration-zinc-600 md:text-sm">
                    {format(compareAtPriceCents)}
                  </span>
                )}
              </div>
              <ProductCardStats
                timesBought={timesBought}
                reviewCount={reviewCount}
                avgRating={avgRating}
              />
            </div>
          </div>
        </Link>

        <AdminEditButton productId={productId} />
      </div>

      <QuickViewModal
        slug={slug}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  )
}
