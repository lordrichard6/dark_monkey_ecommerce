import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params
  const t = await getTranslations('store')
  return {
    title: t('categoriesTitle'),
    description: t('categoriesMetaDescription'),
  }
}

// ISR: Revalidate categories page every 1 hour (static content, rarely changes)
export const revalidate = 3600

import { CATEGORIES } from '@/lib/categories'

export default async function CategoriesPage() {
  const t = await getTranslations('store')

  // Map the hard-coded categories to card format
  const categoryCards = CATEGORIES.map(cat => ({
    title: cat.name,
    description: '', // We can add descriptions if needed, or leave empty
    href: `/categories/${cat.slug}`,
    linkText: `Shop ${cat.name}`,
  }))

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-12 text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">
          Categories
        </h1>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-zinc-900/60 hover:shadow-amber-500/10"
            >
              <div>
                <h2 className="text-2xl font-bold text-zinc-50 transition-colors group-hover:text-amber-400">
                  {card.title}
                </h2>
                {card.description && (
                  <p className="mt-4 text-zinc-400 line-clamp-2">
                    {card.description}
                  </p>
                )}
              </div>

              <div className="mt-12 flex items-center gap-2 text-sm font-semibold text-zinc-300 transition-all group-hover:gap-3 group-hover:text-white">
                {card.linkText}
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Gradient background effect on hover */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
