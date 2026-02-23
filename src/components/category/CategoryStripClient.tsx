'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'

type Category = {
  id: string
  name: string
  slug: string
  image_url: string | null
}

type Props = {
  categories: Category[]
  title: string
  viewAllLabel: string
}

export function CategoryStripClient({ categories, title, viewAllLabel }: Props) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
      {/* Section header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-amber-500/80">
            Collections
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat, index) => (
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
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
                    Explore
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
