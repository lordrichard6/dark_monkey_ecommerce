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
          <span className="absolute left-2 top-2 z-10 rounded-md bg-amber-500/90 px-2 py-0.5 text-xs font-semibold text-zinc-950">
            {t('bestseller')}
          </span>
        )}
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
        <p className="mt-1 text-sm text-zinc-400">{format(priceCents)}</p>
      </div>
    </Link>
  )
}
