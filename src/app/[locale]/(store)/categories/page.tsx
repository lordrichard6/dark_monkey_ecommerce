import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string }> }

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('store')
  const title = t('categoriesTitle')
  const description = t('categoriesMetaDescription')
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/${locale}/categories`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CategoriesPage() {
  const t = await getTranslations('store')

  const supabase = await createClient()

  // Fetch root categories and sub-categories with product counts in parallel
  const [{ data: rootCategories }, { data: subCatCounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, image_url')
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('categories').select('id, parent_id, products(id)').not('parent_id', 'is', null),
  ])

  // Sum product counts per root category
  const countByParent: Record<string, number> = {}
  for (const sub of subCatCounts ?? []) {
    if (!sub.parent_id) continue
    const count = Array.isArray(sub.products) ? sub.products.length : 0
    countByParent[sub.parent_id] = (countByParent[sub.parent_id] ?? 0) + count
  }

  const categoryCards = (rootCategories ?? []).map((cat) => ({
    title: cat.name,
    description: cat.description || '',
    href: `/categories/${cat.slug}` as '/',
    image: cat.image_url || '/images/hero_bg.webp',
    productCount: countByParent[cat.id] ?? 0,
  }))

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] bg-zinc-950">
      {/* Cover the header area background to avoid seams with global gradient orbs */}
      <div className="absolute inset-x-0 -top-14 bottom-0 -z-10 bg-zinc-950" />
      <div className="mx-auto max-w-7xl px-4 pt-0 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-50 md:text-6xl">
            {t('categoriesTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">{t('categoriesMetaDescription')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] active:scale-[0.98] active:brightness-95 active:duration-75"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-80"
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
                    <p className="mt-1 text-xs font-medium text-zinc-400">
                      {t('productCount', { count: card.productCount })}
                    </p>
                  )}
                  {card.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-300 md:opacity-0 md:transition-all md:duration-500 md:group-hover:opacity-100">
                      {card.description}
                    </p>
                  )}
                  <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
                    <span>{t('exploreCollection')}</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
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
      </div>
    </div>
  )
}
