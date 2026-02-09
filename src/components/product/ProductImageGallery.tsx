'use client'

import { useState } from 'react'
import { ProductImageWithFallback } from './ProductImageWithFallback'

type ImageItem = {
  url: string
  alt: string | null
  sort_order: number
  color?: string | null
}

type ProductImageGalleryProps = {
  images: ImageItem[]
  productName: string
  selectedColor?: string | null
}

function isUnoptimized(url: string): boolean {
  return (
    url.endsWith('.svg') ||
    url.includes('picsum.photos') ||
    url.includes('/storage/') ||
    url.includes('product-images')
  )
}

export function ProductImageGallery({ images, productName, selectedColor }: ProductImageGalleryProps) {
  // Filter images: show if image has NO color (universal) OR matches selectedColor
  // Filter images: show if image has NO color (universal) OR matches selectedColor
  const filtered = selectedColor
    ? images.filter(img => !img.color || img.color === selectedColor)
    : images

  // Deduplicate: Keep one image per color. 
  // If multiple images exist for the same color, keep only the first one.
  // Always keep images with no color (universal).
  const unique = filtered.filter((img, index, self) => {
    if (!img.color) return true
    // Find the first occurrence of this color
    const firstIndex = self.findIndex(t => t.color === img.color)
    return index === firstIndex
  })

  const sorted = [...unique].sort((a, b) => a.sort_order - b.sort_order)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset selection when color changes (optional, but good UX to show first image of new color)
  // We can use a key on the component in parent to force reset, or useEffect here.
  // For now simple index reset if out of bounds
  const safeIndex = selectedIndex >= sorted.length ? 0 : selectedIndex
  const main = sorted[safeIndex]

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
              className={`relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition md:w-20 ${safeIndex === i
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

      {/* Main image: Full-bleed aspect ratio container with object-cover */}
      <div className="relative min-h-0 flex-1 group">
        <div className="relative aspect-[4/5] w-full flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm">
          <ProductImageWithFallback
            src={main.url}
            alt={main.alt ?? productName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={safeIndex === 0}
            unoptimized={isUnoptimized(main.url)}
          />
        </div>
      </div>
    </div>
  )
}
