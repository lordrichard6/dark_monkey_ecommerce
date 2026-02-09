'use client'

import Image from 'next/image'
import Link from 'next/link'

type ProductCardProps = {
  slug: string
  name: string
  priceCents: number
  compareAtPriceCents?: number | null
  imageUrl: string
  imageAlt: string
}

import { useCurrency } from '@/components/currency/CurrencyContext'

// ...

export function ProductCard({
  slug,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  imageAlt,
}: ProductCardProps) {
  const { format } = useCurrency()
  return (
    <Link
      href={`/products/${slug}`}
      className="group block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={imageUrl.endsWith('.svg') || imageUrl.includes('picsum.photos')}
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-zinc-50 group-hover:text-white truncate">
          {name}
        </h3>
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
