'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'

type CategoryItem = {
  id: string
  name: string
  slug: string
  image_url: string | null
  is_featured: boolean
  subtitle: string | null
}

type Props = {
  categories: CategoryItem[]
  title: string
  viewAllLabel: string
  collectionsLabel: string
  exploreLabel: string
}

function FeaturedCategoryCard({ category }: { category: CategoryItem }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="featured-card group relative col-span-2 overflow-hidden rounded-2xl border border-amber-500/30 bg-zinc-950 shadow-lg shadow-amber-900/20 transition-all duration-300 hover:border-amber-400/60 hover:shadow-amber-800/30"
      style={{ minHeight: '220px' }}
    >
      {/* Shimmer sweep overlay */}
      <div className="shimmer-sweep pointer-events-none absolute inset-0 z-10" />

      {/* Background image */}
      {category.image_url && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- image_url may be a Supabase storage URL */}
          <img
            src={category.image_url}
            alt={category.name}
            className="h-full w-full object-cover opacity-25 transition-opacity duration-500 group-hover:opacity-35"
          />
        </div>
      )}

      {/* Gold gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 120% 60% at 50% 110%, rgba(245,158,11,0.18) 0%, transparent 60%)',
            'radial-gradient(ellipse at 30% 50%, rgba(180,120,0,0.12) 0%, transparent 50%)',
            'linear-gradient(135deg, rgba(20,16,6,0.95) 0%, rgba(10,8,3,0.98) 100%)',
          ].join(', '),
        }}
      />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col justify-between p-6">
        {/* Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Exclusive
          </span>
        </div>

        {/* Name + subtitle */}
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-amber-300 drop-shadow-sm transition-colors duration-200 group-hover:text-amber-200 sm:text-3xl">
            {category.name}
          </h3>
          {category.subtitle && (
            <p className="mt-1 text-sm text-amber-600/80 transition-colors group-hover:text-amber-500/90">
              {category.subtitle}
            </p>
          )}
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-500 transition-all duration-200 group-hover:gap-2 group-hover:text-amber-400">
            Explore collection
            <svg
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
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
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-amber-500/80">
            {collectionsLabel}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-zinc-50 md:text-3xl">{title}</h2>
        </div>
        <Link
          href="/categories"
          className="group flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:gap-5">
        {featured.map((cat) => (
          <FeaturedCategoryCard key={cat.id} category={cat} />
        ))}
        {regular.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group relative overflow-hidden rounded-2xl"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {/* Card aspect ratio container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              {/* Background image */}
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  unoptimized={cat.image_url.includes('/storage/')}
                />
              ) : (
                <div className="h-full w-full bg-zinc-800" />
              )}

              {/* Gradient overlay — stronger at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

              {/* Subtle top-left glow on hover */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(ellipse at 20% 20%, rgba(251,191,36,0.08) 0%, transparent 60%)',
                }}
              />

              {/* Border ring */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-amber-500/30" />

              {/* Bottom content */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                {/* Category name */}
                <p className="text-sm font-bold leading-tight text-zinc-50 transition-transform duration-300 group-hover:-translate-y-0.5 md:text-base">
                  {cat.name}
                </p>

                {/* "Explore" label — slides up on hover */}
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="translate-y-4 text-[11px] font-medium text-amber-400/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {exploreLabel}
                  </span>
                  <ArrowRight className="h-3 w-3 translate-y-4 text-amber-400/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
