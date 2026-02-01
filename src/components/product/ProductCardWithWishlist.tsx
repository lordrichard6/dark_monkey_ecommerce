'use client'

import Image from 'next/image'
import Link from 'next/link'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ProductName } from './ProductName'

type ProductCardProps = {
  slug: string
  productId: string
  name: string
  priceCents: number
  imageUrl: string
  imageAlt: string
  isInWishlist?: boolean
  showWishlist?: boolean
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function ProductCardWithWishlist({
  slug,
  productId,
  name,
  priceCents,
  imageUrl,
  imageAlt,
  isInWishlist = false,
  showWishlist = true,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={
            imageUrl.endsWith('.svg') ||
            imageUrl.includes('picsum.photos') ||
            imageUrl.includes('placehold.co')
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
        <p className="mt-1 text-sm text-zinc-400">{formatPrice(priceCents)}</p>
      </div>
    </Link>
  )
}
