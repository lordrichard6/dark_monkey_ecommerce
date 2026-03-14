'use client'

import { Link } from '@/i18n/navigation'
import NextImage from 'next/image'
import { FeaturedCategoryCard, type CategoryItem } from './FeaturedCategoryCard'

type RegularCard = {
  id: string
  title: string
  description: string
  href: '/'
  image: string
  productCount: number
  productCountLabel: string
}

type Props = {
  featuredCategories: CategoryItem[]
  regularCards: RegularCard[]
  exploreLabel: string
}

export function CategoriesPageClient({ featuredCategories, regularCards, exploreLabel }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Featured gold cards — span 2 cols, pinned to top */}
      {featuredCategories.map((cat) => (
        <FeaturedCategoryCard key={cat.id} category={cat} />
      ))}

      {/* Regular category cards */}
      {regularCards.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className="group relative h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] active:scale-[0.98] active:brightness-95 active:duration-75"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110">
            <NextImage
              src={card.image}
              alt={card.title}
              fill
              className="object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-80"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized={card.image.includes('/storage/')}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-8">
            <div className="translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-lg">
                {card.title}
              </h2>
              {card.productCount > 0 && (
                <p className="mt-1 text-xs font-medium text-zinc-400">{card.productCountLabel}</p>
              )}
              {card.description && (
                <p className="mt-2 line-clamp-2 text-sm text-zinc-300 md:opacity-0 md:transition-all md:duration-500 md:group-hover:opacity-100">
                  {card.description}
                </p>
              )}
              <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
                <span>{exploreLabel}</span>
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Top Accent Decoration */}
          <div className="absolute right-6 top-6 h-px w-0 bg-amber-500/50 transition-all duration-500 group-hover:w-16" />
          <div className="absolute right-6 top-6 h-0 w-px bg-amber-500/50 transition-all duration-500 group-hover:h-16" />
        </Link>
      ))}
    </div>
  )
}
