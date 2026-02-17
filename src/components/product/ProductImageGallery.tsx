'use client'

import { useState, useEffect, useMemo } from 'react'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

type ImageItem = {
  url: string
  alt: string | null
  sort_order: number
  color?: string | null
  variant_id?: string | null
}

interface ProductImageGalleryProps {
  images: ImageItem[]
  productName: string
  selectedColor?: string | null
  selectedVariantId?: string | null
  className?: string
  showThumbnails?: boolean
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
  selectedVariantId,
  className = '',
  showThumbnails = true,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem>(images[0])
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const filtered = useMemo(() => {
    if (!selectedColor && !selectedVariantId) return images
    const matched = images.filter((img) => {
      if (img.sort_order === 0 && !img.color && !img.variant_id) return true
      if (selectedVariantId && img.variant_id === selectedVariantId) return true
      if (selectedColor && img.color === selectedColor) return true
      if (img.sort_order === 0) return true
      return false
    })
    return matched.length === 0 ? images : matched
  }, [images, selectedColor, selectedVariantId])

  const unique = useMemo(
    () =>
      filtered
        .filter((img, index, self) => index === self.findIndex((t) => t.url === img.url))
        .sort((a, b) => {
          if (selectedVariantId) {
            if (a.variant_id === selectedVariantId) return -1
            if (b.variant_id === selectedVariantId) return 1
          }
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

  useEffect(() => {
    if (unique.length > 0) {
      const stillInList = unique.find((img) => img.url === selectedImage?.url)
      if (!stillInList) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedImage(unique[0])
      }
    }
  }, [unique, selectedImage?.url])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % unique.length)
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + unique.length) % unique.length)

  if (unique.length === 0) return null

  const selectedIndex = unique.findIndex((img) => img.url === selectedImage?.url)
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Main Image Container */}
      <div
        className="relative group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm cursor-zoom-in"
        onClick={() => openLightbox(safeIndex)}
      >
        <div className="relative aspect-square w-full sm:aspect-[4/5]">
          <ProductImageWithFallback
            src={selectedImage?.url ?? unique[0].url}
            alt={selectedImage?.alt ?? productName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 40vw"
            priority
            unoptimized={isUnoptimized(selectedImage?.url ?? unique[0].url)}
          />
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white/70 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-md border border-white/10 pointer-events-none">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>

      {/* Thumbnails Row */}
      {showThumbnails && unique.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {unique.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${safeIndex === i
                  ? 'border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                  : 'border-white/5 bg-zinc-900/40 hover:border-white/20'
                }`}
            >
              <ProductImageWithFallback
                src={img.url}
                alt={img.alt ?? productName}
                fill
                className="object-cover"
                sizes="50px"
                unoptimized={isUnoptimized(img.url)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 border border-white/10"
          >
            <X className="h-7 w-7" />
          </button>

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

          <div className="relative h-[85vh] w-[90vw]" onClick={() => setIsLightboxOpen(false)}>
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

          {unique.length > 1 && (
            <div className="absolute bottom-8 left-1/2 flex max-w-full -translate-x-1/2 gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
              {unique.map((img, i) => (
                <button
                  key={`thumb-${i}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(i)
                  }}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${i === lightboxIndex
                      ? 'border-amber-500 scale-110 ring-4 ring-amber-500/20'
                      : 'border-white/10 opacity-40 hover:opacity-100'
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

          <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-zinc-300 border border-white/10 backdrop-blur-md">
            {lightboxIndex + 1} <span className="mx-1 opacity-50">/</span> {unique.length}
          </div>
        </div>
      )}
    </div>
  )
}
