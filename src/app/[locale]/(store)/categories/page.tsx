import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { CategoriesPageClient } from '@/components/category/CategoriesPageClient'
import type { CategoryItem } from '@/components/category/FeaturedCategoryCard'

type Props = { params: Promise<{ locale: string }> }

export const revalidate = 3600

const SUPPORTED_LOCALES = ['en', 'pt', 'de', 'it', 'fr'] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('store')
  const title = t('categoriesTitle')
  const description = t('categoriesMetaDescription')
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/categories`,
      languages: {
        ...Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `${SITE_URL}/${l}/categories`])),
        'x-default': `${SITE_URL}/en/categories`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/${locale}/categories`,
      siteName: 'Dark Monkey',
      locale,
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

  // Fetch root categories, sub-categories with product counts, and direct root product counts in parallel
  const [{ data: rootCategories }, { data: subCatCounts }, { data: rootProductCounts }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, description, image_url, is_featured, subtitle')
        .is('parent_id', null)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('categories')
        .select('id, parent_id, products(id)')
        .not('parent_id', 'is', null),
      // Also count products assigned directly to root categories (e.g. featured categories with no subcategories)
      supabase.from('categories').select('id, products(id)').is('parent_id', null),
    ])

  // Sum product counts per root category
  const countByParent: Record<string, number> = {}
  // Roll up subcategory product counts to their parent
  for (const sub of subCatCounts ?? []) {
    if (!sub.parent_id) continue
    const count = Array.isArray(sub.products) ? sub.products.length : 0
    countByParent[sub.parent_id] = (countByParent[sub.parent_id] ?? 0) + count
  }
  // Add products assigned directly to root categories
  for (const root of rootProductCounts ?? []) {
    const count = Array.isArray(root.products) ? root.products.length : 0
    if (count > 0) countByParent[root.id] = (countByParent[root.id] ?? 0) + count
  }

  const allCategories = (rootCategories ?? []).filter((cat) => (countByParent[cat.id] ?? 0) > 0)

  // Featured categories for the gold shimmer card
  const featuredCategories: CategoryItem[] = allCategories
    .filter((cat) => cat.is_featured)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image_url: cat.image_url,
      is_featured: cat.is_featured ?? false,
      subtitle: cat.subtitle ?? null,
    }))

  // Regular (non-featured) category cards
  const regularCards = allCategories
    .filter((cat) => !cat.is_featured)
    .map((cat) => ({
      id: cat.id,
      title: cat.name,
      description: cat.description || '',
      href: `/categories/${cat.slug}` as '/',
      image: cat.image_url || '/images/hero_bg.webp',
      productCount: countByParent[cat.id] ?? 0,
      productCountLabel: t('productCount', { count: countByParent[cat.id] ?? 0 }),
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

        <CategoriesPageClient
          featuredCategories={featuredCategories}
          regularCards={regularCards}
          exploreLabel={t('exploreCollection')}
        />
      </div>
    </div>
  )
}
