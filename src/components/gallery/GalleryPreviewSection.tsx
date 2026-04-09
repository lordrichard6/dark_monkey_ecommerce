import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { getGalleryItems } from '@/actions/gallery'
import { getTranslations } from 'next-intl/server'

export async function GalleryPreviewSection() {
  const [{ items }, t] = await Promise.all([getGalleryItems(10), getTranslations('common')])

  if (items.length === 0) return null

  const isSingleItem = items.length === 1
  // 2× duplication is enough for a seamless marquee loop
  const loopItems = isSingleItem ? items : [...items, ...items]

  return (
    <section className="relative overflow-hidden py-24 bg-zinc-950">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 m-auto h-[300px] w-[300px] rounded-full bg-amber-500/15 blur-[80px]" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-500/15 blur-[80px]" />
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
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Gallery Display */}
      <div
        className={`relative w-full ${isSingleItem ? 'flex justify-center' : 'overflow-hidden group'}`}
      >
        {!isSingleItem && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-20 pointer-events-none" />
          </>
        )}

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
              />
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
    </section>
  )
}
