'use client'

import { useState } from 'react'
import { ProductImageWithFallback } from './ProductImageWithFallback'

type ImageItem = {
  url: string
  alt: string | null
  sort_order: number
}

type ProductImageGalleryProps = {
  images: ImageItem[]
  productName: string
}

function isUnoptimized(url: string): boolean {
  return (
    url.endsWith('.svg') ||
    url.includes('picsum.photos') ||
    url.includes('/storage/') ||
    url.includes('product-images')
  )
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const main = sorted[selectedIndex]

  if (sorted.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-600">
        No image
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      {/* Thumbnails (vertical, left) */}
      {sorted.length > 1 && (
        <div className="flex shrink-0 flex-col gap-2">
          {sorted.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition md:w-20 ${
                selectedIndex === i
                  ? 'border-amber-500 ring-2 ring-amber-500/30'
                  : 'border-zinc-700 bg-zinc-800/80 hover:border-zinc-600'
              }`}
            >
              <span className="absolute inset-0 block">
                <span className="relative block size-full">
                  <ProductImageWithFallback
                    src={img.url}
                    alt={img.alt ?? productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={isUnoptimized(img.url)}
                  />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main image: portrait-friendly aspect so full image fills (no dark letterboxing) */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="relative aspect-[3/4] w-full">
          <ProductImageWithFallback
            src={main.url}
            alt={main.alt ?? productName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={selectedIndex === 0}
            unoptimized={isUnoptimized(main.url)}
          />
        </div>
      </div>
    </div>
  )
}
