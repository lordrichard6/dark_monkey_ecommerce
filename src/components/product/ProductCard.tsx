'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightLeft } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { QuickViewModal } from './QuickViewModal'
import { useCompare } from '@/lib/store/use-compare'
import { Product } from '@/types'

type ProductCardProps = {
  id: string
  slug: string
  name: string
  priceCents: number
  compareAtPriceCents?: number | null
  imageUrl: string
  imageAlt: string
  fullProduct?: Product
}

export function ProductCard({
  id,
  slug,
  name,
  priceCents,
  compareAtPriceCents,
  imageUrl,
  imageAlt,
  fullProduct,
}: ProductCardProps) {
  const { format } = useCurrency()
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const { addProduct, removeProduct, isInCompare } = useCompare()

  const isComparing = isInCompare(id)

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
      <div className="group block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm transition hover:border-white/20">
        <Link href={`/products/${slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                loading="lazy"
                unoptimized={imageUrl.endsWith('.svg') || imageUrl.includes('picsum.photos')}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
                <span className="text-xs">No image</span>
              </div>
            )}
            {/* Compare Button */}
            <button
              onClick={toggleCompare}
              className={`absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
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
            <h3 className="line-clamp-2 h-12 font-medium text-zinc-50 group-hover:text-white">
              {name}
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              {compareAtPriceCents && compareAtPriceCents > priceCents && (
                <span className="text-sm text-zinc-500 line-through decoration-zinc-500/50">
                  {format(compareAtPriceCents)}
                </span>
              )}
              <span
                className={`text-lg font-bold ${compareAtPriceCents && compareAtPriceCents > priceCents ? 'text-amber-500' : 'text-zinc-200'}`}
              >
                {format(priceCents || 0)}
              </span>
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
