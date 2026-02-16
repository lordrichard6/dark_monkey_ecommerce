'use client'

import { useState, useEffect, useMemo } from 'react'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

type ImageItem = {
  url: string
  alt: string | null
  sort_order: number
  color?: string | null
  variant_id?: string | null // Database UUID
}

type ProductImageGalleryProps = {
  images: ImageItem[]
  productName: string
  selectedColor?: string
  selectedVariantId?: string | null // Database UUID
}

function isUnoptimized(url: string): boolean {
  return (
    url.endsWith('.svg') ||
    url.includes('picsum.photos') ||
    url.includes('/storage/') ||
    url.includes('product-images')
  )
}

export function ProductImageGallery({
  images,
  productName,
  selectedColor,
  selectedVariantId
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem>(images[0])
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Filter images: logic for variant-specific mockups
  const filtered = useMemo(() => {
    // If no selection, show all images
    if (!selectedColor && !selectedVariantId) return images

    const matched = images.filter(img => {
      // 1. Always keep primary design mockup (universal or explicitly sort_order 0)
      if (img.sort_order === 0 && !img.color && !img.variant_id) return true

      // 2. If it matches the exact variant ID (highest priority)
      if (selectedVariantId && img.variant_id === selectedVariantId) return true

      // 3. If it matches the selected color (and has no variant ID or is a color-wide mockup)
      if (selectedColor && img.color === selectedColor) {
        return true
      }

      // 4. Default design mockups (usually the primary one) should stay visible for reference
      if (img.sort_order === 0) return true

      return false
    })

    // FALLBACK: If filtering removed all images, show all images
    // This happens when images were synced before variant_id was added
    if (matched.length === 0) {
      console.warn('[ProductImageGallery] No images matched filters, showing all images. Re-sync from Printful to fix.')
      return images
    }

    return matched
  }, [images, selectedColor, selectedVariantId])

  // Deduplicate by URL and sort
  const unique = useMemo(() =>
    filtered
      .filter((img, index, self) => index === self.findIndex(t => t.url === img.url))
      .sort((a, b) => {
        // Prioritize exact variant match
        if (selectedVariantId) {
          if (a.variant_id === selectedVariantId) return -1
          if (b.variant_id === selectedVariantId) return 1
        }

        // Prioritize selected color match
        if (selectedColor) {
          const aMatch = a.color === selectedColor
          const bMatch = b.color === selectedColor
          if (aMatch && !bMatch) return -1
          if (!aMatch && bMatch) return 1
        }

        return a.sort_order - b.sort_order
      }),
    [filtered, selectedVariantId, selectedColor]
  )

  // Always switch to the first image (the preferred one) when selection criteria change
  useEffect(() => {
    if (unique.length > 0) {
      setSelectedImage(unique[0])
    }
  }, [selectedColor, selectedVariantId, unique.length > 0 ? unique[0].url : null])

  // Fallback check to ensure we always have a selection if the current one somehow disappears
  useEffect(() => {
    if (unique.length > 0) {
      const stillInList = unique.find(img => img.url === selectedImage?.url)
      if (!stillInList) {
        setSelectedImage(unique[0])
      }
    }
  }, [unique, selectedImage?.url])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % unique.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + unique.length) % unique.length)
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [isLightboxOpen])

  if (unique.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-600">
        No image
      </div>
    )
  }

  const selectedIndex = unique.findIndex(img => img.url === selectedImage?.url)
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex

  return (
    <div className="flex gap-3">
      {/* Thumbnails (vertical, left) */}
      {unique.length > 1 && (
        <div className="flex shrink-0 flex-col gap-2">
          {unique.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setSelectedImage(img)}
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

      {/* Main image */}
      <div className="relative min-h-0 flex-1 group">
        <div
          className="relative aspect-[4/5] w-full flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm cursor-zoom-in"
          onClick={() => openLightbox(safeIndex)}
        >
          <ProductImageWithFallback
            src={selectedImage?.url ?? images[0].url}
            alt={selectedImage?.alt ?? productName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={safeIndex === 0}
            unoptimized={isUnoptimized(selectedImage?.url ?? images[0].url)}
          />
          <div className="absolute right-4 top-4 rounded-full bg-black/50 p-2.5 text-white/70 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-md border border-white/10 pointer-events-none">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg">
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 border border-white/10"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Navigation buttons */}
          {unique.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-6 z-10 rounded-full bg-white/10 p-4 text-white transition hover:bg-white/20 border border-white/10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-6 z-10 rounded-full bg-white/10 p-4 text-white transition hover:bg-white/20 border border-white/10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative h-[85vh] w-[90vw]"
            onClick={() => setIsLightboxOpen(false)}
          >
            <ProductImageWithFallback
              src={unique[lightboxIndex].url}
              alt={unique[lightboxIndex].alt ?? productName}
              fill
              className="object-contain"
              unoptimized={isUnoptimized(unique[lightboxIndex].url)}
              priority
              sizes="90vw"
            />
          </div>

          {/* Thumbnail strip */}
          {unique.length > 1 && (
            <div className="absolute bottom-8 left-1/2 flex max-w-full -translate-x-1/2 gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
              {unique.map((img, i) => (
                <button
                  key={`thumb-${i}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(i)
                  }}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${i === lightboxIndex ? 'border-amber-500 scale-110 ring-4 ring-amber-500/20' : 'border-white/10 opacity-40 hover:opacity-100'
                    }`}
                >
                  <ProductImageWithFallback
                    src={img.url}
                    alt={img.alt || ''}
                    fill
                    className="object-cover"
                    unoptimized={isUnoptimized(img.url)}
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Image counter */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-zinc-300 border border-white/10 backdrop-blur-md">
            {lightboxIndex + 1} <span className="mx-1 opacity-50">/</span> {unique.length}
          </div>
        </div>
      )}
    </div>
  )
}
