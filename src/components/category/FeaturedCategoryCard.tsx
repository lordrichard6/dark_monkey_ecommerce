'use client'

import { Link } from '@/i18n/navigation'

export type CategoryItem = {
  id: string
  name: string
  slug: string
  image_url: string | null
  is_featured: boolean
  subtitle: string | null
}

export function FeaturedCategoryCard({ category }: { category: CategoryItem }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="featured-card group relative block h-full overflow-hidden rounded-2xl border border-amber-500/30 bg-zinc-950 shadow-lg shadow-amber-900/20 transition-all duration-300 hover:border-amber-400/60 hover:shadow-amber-800/30 min-h-[200px] md:min-h-[240px]"
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
            className="h-full w-full object-cover object-center opacity-55 transition-opacity duration-500 group-hover:opacity-70"
          />
        </div>
      )}

      {/* Gold gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 120% 60% at 50% 110%, rgba(245,158,11,0.22) 0%, transparent 60%)',
            'radial-gradient(ellipse at 30% 50%, rgba(180,120,0,0.15) 0%, transparent 50%)',
            'linear-gradient(135deg, rgba(20,16,6,0.55) 0%, rgba(10,8,3,0.65) 100%)',
          ].join(', '),
        }}
      />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col justify-between p-4 sm:p-6">
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
          <h3 className="text-xl font-black uppercase tracking-tight text-amber-300 drop-shadow-sm transition-colors duration-200 group-hover:text-amber-200 sm:text-2xl md:text-3xl">
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
