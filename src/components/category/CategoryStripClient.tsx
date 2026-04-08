'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { FeaturedCategoryCard, type CategoryItem } from './FeaturedCategoryCard'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

type Props = {
  categories: CategoryItem[]
  title: string
  viewAllLabel: string
  collectionsLabel: string
  exploreLabel: string
}

export function CategoryStripClient({
  categories,
  title,
  viewAllLabel,
  collectionsLabel,
  exploreLabel,
}: Props) {
  const featured = categories.filter((c) => c.is_featured)
  const regular = categories.filter((c) => !c.is_featured)

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
      {/* Section header */}
      <ScrollReveal>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-amber-500/80">
              {collectionsLabel}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-zinc-50 md:text-3xl">{title}</h2>
          </div>
          <Link
            href="/categories"
            className="group flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-zinc-100"
          >
            {viewAllLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5" />
          </Link>
        </div>
      </ScrollReveal>

      {/* Featured gold card — full width, above the regular strip */}
      {featured.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
          {featured.map((cat, i) => (
            <div key={cat.id} className="sm:col-span-2" style={{ minHeight: '240px' }}>
              <ScrollReveal delay={i * 0.05}>
                <FeaturedCategoryCard category={cat} index={i} />
              </ScrollReveal>
            </div>
          ))}
        </div>
      )}

      {/* Regular category cards */}
      {regular.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
          {regular.map((cat, index) => (
            <RegularCategoryCard key={cat.id} cat={cat} index={index} exploreLabel={exploreLabel} />
          ))}
        </div>
      )}
    </section>
  )
}

function RegularCategoryCard({
  cat,
  index,
  exploreLabel,
}: {
  cat: CategoryItem
  index: number
  exploreLabel: string
}) {
  const delay = Math.min(index % 4, 3) * 0.08

  return (
    <ScrollReveal delay={delay}>
      <Link
        href={`/categories/${cat.slug}`}
        className="group relative overflow-hidden rounded-2xl block"
      >
        {/* Card aspect ratio container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {/* Background image */}
          {cat.image_url ? (
            <Image
              src={cat.image_url}
              alt={cat.name}
              fill
              className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              unoptimized={cat.image_url.includes('/storage/')}
            />
          ) : (
            <div className="h-full w-full bg-zinc-800" />
          )}

          {/* Gradient overlay — stronger at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/90" />

          {/* Subtle top-left glow on hover */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(ellipse at 20% 20%, rgba(251,191,36,0.08) 0%, transparent 60%)',
            }}
          />

          {/* Border ring */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:ring-amber-500/30" />

          {/* Bottom content */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-sm font-bold leading-tight text-zinc-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 md:text-base">
              {cat.name}
            </p>
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="translate-y-4 text-[11px] font-medium text-amber-400/90 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:opacity-100">
                {exploreLabel}
              </span>
              <ArrowRight className="h-3 w-3 translate-y-4 text-amber-400/90 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}
