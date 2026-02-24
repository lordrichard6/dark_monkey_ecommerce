'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { GalleryItem, getGalleryItems } from '@/actions/gallery'
import { useTranslations } from 'next-intl'

export function GalleryPreviewSection() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('common') // Assuming there's a common namespace, or I can use raw strings if needed

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Fetch more items to ensure smooth loop (20 items)
        const { items } = await getGalleryItems(10)
        setItems(items)
      } catch (error) {
        console.error('Failed to fetch gallery preview', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  if (loading || items.length === 0) return null

  // If we only have 1 item, don't loop, just center it.
  const isSingleItem = items.length === 1
  const loopItems = isSingleItem ? items : [...items, ...items, ...items, ...items] // More duplication for smoother loop if needed

  return (
    <section className="relative overflow-hidden py-24 bg-zinc-950">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 m-auto h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-[100px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4 tracking-tight">
          {t('galleryTitle')}
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg mb-8">{t('gallerySubtitle')}</p>

        <Link
          href="/art"
          aria-label={t('viewFullGallery')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
        >
          {t('viewFullGallery')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Gallery Display - Centered if Single, Marquee if Multiple */}
      <div
        className={`relative w-full ${isSingleItem ? 'flex justify-center' : 'overflow-hidden group'}`}
      >
        {/* Gradient Masks (Only for marquee) */}
        {!isSingleItem && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-20 pointer-events-none" />
          </>
        )}

        {/* Track */}
        <div
          className={`flex gap-6 ${!isSingleItem ? 'animate-marquee hover:[animation-play-state:paused]' : ''}`}
          style={!isSingleItem ? { width: 'max-content' } : {}}
        >
          {loopItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="relative w-[200px] h-[280px] md:w-[260px] md:h-[360px] flex-shrink-0 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl transition-transform hover:scale-[1.02] hover:border-white/10"
            >
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 200px, 260px"
                loading="lazy"
                onError={(e) => {
                  // Fallback to placeholder if image fails
                  const target = e.target as HTMLImageElement
                  target.src = 'https://placehold.co/400x600/18181b/52525b?text=Image+Error'
                }}
              />
              {/* Vote Count Badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-10">
                <Heart className="w-3 h-3 text-white fill-white" />
                <span className="text-[10px] font-bold text-white">{item.votes_count}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                <h3 className="text-white font-bold text-lg truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-zinc-300 text-sm truncate">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / ${isSingleItem ? 1 : 4}));
          }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
      `}</style>
    </section>
  )
}
