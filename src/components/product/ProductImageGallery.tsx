'use client'

import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { X, ChevronLeft, ChevronRight, ZoomIn, Play } from 'lucide-react'

type ImageItem = {
  url: string
  alt: string | null
  sort_order: number
  color?: string | null
  variant_id?: string | null
  video_url?: string | null
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

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)
  return m ? m[1] : null
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)
}

function VideoEmbed({ url, className = '' }: { url: string; className?: string }) {
  const ytId = getYouTubeId(url)
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
        className={`w-full h-full ${className}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Product video"
      />
    )
  }

  const vimeoId = getVimeoId(url)
  if (vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
        className={`w-full h-full ${className}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Product video"
      />
    )
  }

  if (isDirectVideo(url)) {
    return (
      <video src={url} controls autoPlay className={`w-full h-full object-contain ${className}`} />
    )
  }

  return null
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
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

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
    if (unique.length === 0) return
    const colourMatch = selectedColor ? unique.find((img) => img.color === selectedColor) : null
    setSelectedImage(colourMatch ?? unique[0])
    setPlayingVideo(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedVariantId])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = useCallback(() => setIsLightboxOpen(false), [])
  const nextImage = useCallback(
    () => setLightboxIndex((prev) => (prev + 1) % unique.length),
    [unique.length]
  )
  const prevImage = useCallback(
    () => setLightboxIndex((prev) => (prev - 1 + unique.length) % unique.length),
    [unique.length]
  )

  useEffect(() => {
    if (!isLightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, closeLightbox, nextImage, prevImage])

  if (unique.length === 0) return null

  const selectedIndex = unique.findIndex((img) => img.url === selectedImage?.url)

  // Decorative background for transparent PNG mockups
  const MOCKUP_BG: CSSProperties = {
    backgroundImage: [
      'radial-gradient(ellipse 160% 50% at 50% 115%, rgba(245,158,11,0.08) 0%, transparent 55%)',
      'radial-gradient(ellipse at 50% 25%, #2e2e32 0%, #18181b 70%)',
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='1' cy='1' r='1' fill='white' fill-opacity='0.025'/%3E%3C/svg%3E\")",
    ].join(', '),
  }

  const THUMBNAIL_BG: CSSProperties = {
    backgroundImage: [
      'radial-gradient(ellipse at 50% 110%, rgba(245,158,11,0.1) 0%, transparent 60%)',
      'radial-gradient(ellipse at 50% 20%, #2a2a2e 0%, #18181b 80%)',
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='1' cy='1' r='1' fill='white' fill-opacity='0.025'/%3E%3C/svg%3E\")",
    ].join(', '),
  }
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex
  const currentItem = unique[safeIndex]
  const hasVideo = Boolean(currentItem?.video_url)
  const isPlayingCurrent = playingVideo === currentItem?.url

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Main Image / Video Container */}
      <div
        style={MOCKUP_BG}
        className="relative group overflow-hidden rounded-2xl border border-white/10 backdrop-blur-sm"
      >
        <div className="relative aspect-square w-full sm:aspect-[4/5]">
          {hasVideo && isPlayingCurrent && currentItem.video_url ? (
            <div className="absolute inset-0">
              <VideoEmbed url={currentItem.video_url} />
            </div>
          ) : (
            <>
              <div className="cursor-zoom-in" onClick={() => openLightbox(safeIndex)}>
                <ProductImageWithFallback
                  src={currentItem?.url ?? unique[0].url}
                  alt={currentItem?.alt ?? productName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 40vw"
                  priority
                  unoptimized={isUnoptimized(currentItem?.url ?? unique[0].url)}
                />
              </div>
              {hasVideo && currentItem.video_url && (
                <button
                  type="button"
                  onClick={() => setPlayingVideo(currentItem.url)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Play video"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-zinc-950 shadow-xl">
                    <Play className="h-6 w-6 translate-x-0.5" />
                  </div>
                </button>
              )}
              {!hasVideo && (
                <div className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white/70 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-md border border-white/10 pointer-events-none">
                  <ZoomIn className="h-4 w-4" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Thumbnails Row */}
      {showThumbnails && unique.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {unique.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => {
                setSelectedImage(img)
                setPlayingVideo(null)
              }}
              style={THUMBNAIL_BG}
              className={`relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                safeIndex === i
                  ? 'border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                  : 'border-white/5 hover:border-white/20'
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
              {img.video_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer — ${productName}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg"
        >
          <button
            onClick={closeLightbox}
            aria-label="Close image viewer"
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

          <div className="relative h-[85vh] w-[90vw]" onClick={closeLightbox}>
            {unique[lightboxIndex].video_url ? (
              <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
                <VideoEmbed url={unique[lightboxIndex].video_url!} />
              </div>
            ) : (
              <ProductImageWithFallback
                src={unique[lightboxIndex].url}
                alt={unique[lightboxIndex].alt ?? productName}
                fill
                className="object-contain"
                unoptimized={isUnoptimized(unique[lightboxIndex].url)}
                priority
                sizes="90vw"
              />
            )}
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
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    i === lightboxIndex
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
                  {img.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  )}
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
