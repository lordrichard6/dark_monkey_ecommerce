'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

type PhotoGalleryProps = {
    photos: string[]
    alt?: string
}

export function ReviewPhotoGallery({ photos, alt = 'Review photo' }: PhotoGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    if (photos.length === 0) return null

    const openLightbox = (index: number) => setLightboxIndex(index)
    const closeLightbox = () => setLightboxIndex(null)

    const nextPhoto = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex + 1) % photos.length)
        }
    }

    const prevPhoto = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
        }
    }

    return (
        <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {photos.map((photo, index) => (
                    <button
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <Image
                            src={photo}
                            alt={`${alt} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                        />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    {/* Navigation */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    prevPhoto()
                                }}
                                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                aria-label="Previous photo"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    nextPhoto()
                                }}
                                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                aria-label="Next photo"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Photo */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
                    >
                        <Image
                            src={photos[lightboxIndex]}
                            alt={`${alt} ${lightboxIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                        />
                    </div>

                    {/* Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-sm">
                        {lightboxIndex + 1} / {photos.length}
                    </div>
                </div>
            )}
        </>
    )
}
