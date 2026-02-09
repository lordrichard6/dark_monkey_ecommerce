'use client'

import { Link } from '@/i18n/navigation'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { ProductName } from './ProductName'

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
  showWishlist?: boolean
}

import { useTranslations } from 'next-intl'
import { useCurrency } from '@/components/currency/CurrencyContext'

// ...

export function ProductCardWithWishlist({
  slug,
  productId,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  imageAlt,
  isInWishlist = false,
  isBestseller = false,
  showWishlist = true,
}: ProductCardProps) {
  const t = useTranslations('product')
  const { format } = useCurrency()
  return (
    <Link
      href={`/products/${slug}`}
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
        {isBestseller && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950">
            {t('bestseller')}
          </span>
        )}
        {compareAtPriceCents && compareAtPriceCents > priceCents && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            SALE
          </span>
        )}
        {/* If both exist, we might want to offset one... let's adjust logic */}
        {isBestseller && compareAtPriceCents && compareAtPriceCents > priceCents ? (
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            <span className="rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              SALE
            </span>
            <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950">
              {t('bestseller')}
            </span>
          </div>
        ) : isBestseller ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950">
            {t('bestseller')}
          </span>
        ) : compareAtPriceCents && compareAtPriceCents > priceCents ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            SALE
          </span>
        ) : null}
        <ProductImageWithFallback
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
