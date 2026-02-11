'use client'

import { Link } from '@/i18n/navigation'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { ProductName } from './ProductName'
import { ProductBadge } from './ProductBadge'

type ProductCardProps = {
  slug: string
  productId: string
  name: string
  priceCents: number
  compareAtPriceCents?: number | null
  imageUrl: string
  imageAlt: string
  isInWishlist?: boolean
  isBestseller?: boolean
  isFeatured?: boolean
  isOnSale?: boolean
  createdAt?: string
  showWishlist?: boolean
}

import { useCurrency } from '@/components/currency/CurrencyContext'

export function ProductCardWithWishlist({
  slug,
  productId,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  imageAlt,
  isInWishlist = false,
  isFeatured = false,
  isOnSale = false,
  createdAt,
  showWishlist = true,
}: ProductCardProps) {
  const { format } = useCurrency()

  // Check if product is new (created within last 3 days)
  const isNew = createdAt
    ? new Date().getTime() - new Date(createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
    : false

  // Determine which badges to show (priority: Sale > New > Featured)
  const badges = []
  if (isOnSale) badges.push('sale')
  if (isNew) badges.push('new')
  if (isFeatured) badges.push('featured')

  return (
    <Link
      href={`/products/${slug}`}
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
        {/* Display badges */}
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {badges.map((badge) => (
              <ProductBadge key={badge} type={badge as 'new' | 'featured' | 'sale'} />
            ))}
          </div>
        )}
        <ProductImageWithFallback
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover object-center transition group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized={
            imageUrl.endsWith('.svg') ||
            imageUrl.includes('picsum.photos') ||
            imageUrl.includes('placehold.co') ||
            imageUrl.includes('/storage/') ||
            imageUrl.includes('product-images')
          }
        />
        {showWishlist && (
          <WishlistButton
            productId={productId}
            productSlug={slug}
            isInWishlist={isInWishlist}
            variant="icon"
          />
        )}
      </div>
      <div className="p-4">
        <ProductName name={name} />
        <div className="mt-2 flex items-baseline gap-2">
          {compareAtPriceCents && compareAtPriceCents > priceCents && (
            <span className="text-sm text-zinc-500 line-through decoration-zinc-500/50">
              {format(compareAtPriceCents)}
            </span>
          )}
          <span className={`text-lg font-bold ${compareAtPriceCents && compareAtPriceCents > priceCents ? 'text-amber-500' : 'text-zinc-200'}`}>
            {format(priceCents || 0)}
          </span>
        </div>
      </div>
    </Link>
  )
}
