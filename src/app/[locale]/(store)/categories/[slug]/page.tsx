import { Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { notFound } from 'next/navigation'
import { VirtualProductGrid } from '@/components/product/VirtualProductGrid'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getCategoryMetadata, getCategoryBySlug, getUserWishlistProductIds } from '@/lib/queries'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ScrollOnParamChange } from '@/components/ScrollOnParamChange'

type Props = {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ sort?: string; subcategory?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const t = await getTranslations('store')
  const category = await getCategoryMetadata(slug)

  if (!category) return { title: 'Category' }

  const title = t('categoryProductsTitle', { name: category.name })
  const description = category.description ?? title
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'

  const ogImages = category.image_url
    ? [{ url: category.image_url, width: 1200, height: 630, alt: title }]
    : []

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/${locale}/categories/${slug}`,
      ...(ogImages.length > 0 && { images: ogImages }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImages.length > 0 && { images: ogImages.map((i) => i.url) }),
    },
  }
}

// ISR: Revalidate category pages every 30 minutes
export const revalidate = 1800
export const dynamicParams = true

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { sort = 'newest', subcategory } = await searchParams

  const supabase = await createClient()
  const { data: categoryData, error: categoryError } = await getCategoryBySlug(slug)

  if (categoryError || !categoryData) notFound()

  const { category, products, subcategories, parent } = categoryData

  // Filter products by active subcategory tab (if any)
  const activeSub = subcategories.find((s) => s.slug === subcategory) ?? null
  const filteredProducts = activeSub
    ? products.filter((p) => p.category_id === activeSub.id)
    : products

  // Fetch user data and wishlist
  const [user, bestsellerIds] = await Promise.all([
    getUserSafe(supabase),
    getBestsellerProductIds(),
  ])

  const wishlistProductIds = user?.id ? await getUserWishlistProductIds(user.id) : []

  const productsWithPrice = filteredProducts.map((p) => {
    const variants = p.product_variants as
      | { price_cents: number; compare_at_price_cents: number | null }[]
      | null
    const images = p.product_images as
      | { url: string; alt: string | null; sort_order: number }[]
      | null
    // Pick cheapest variant and its compare price
    const minVariant = variants?.length
      ? variants.reduce((min, v) => (v.price_cents < min.price_cents ? v : min), variants[0])
      : null
    const minPrice = minVariant?.price_cents ?? 0
    const compareAtPrice = minVariant?.compare_at_price_cents ?? null
    const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) ?? []
    const primaryImage = sortedImages[0]
    const secondImage = sortedImages[1]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dualImageMode = (p as any).dual_image_mode as boolean
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: minPrice,
      compareAtPriceCents: compareAtPrice,
      imageUrl: primaryImage?.url ?? '',
      imageAlt: primaryImage?.alt ?? p.name,
      imageUrl2: dualImageMode ? (secondImage?.url ?? null) : null,
      dualImageMode: dualImageMode && !!secondImage,
      isInWishlist: wishlistProductIds.includes(p.id),
      isBestseller: bestsellerIds.has(p.id),
      isOnSale: !!(compareAtPrice && compareAtPrice > minPrice),
      createdAt: p.created_at,
    }
  })

  const sortedProducts =
    sort === 'price-asc'
      ? [...productsWithPrice].sort((a, b) => a.priceCents - b.priceCents)
      : sort === 'price-desc'
        ? [...productsWithPrice].sort((a, b) => b.priceCents - a.priceCents)
        : sort === 'bestseller'
          ? [...productsWithPrice].sort(
              (a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0)
            )
          : sort === 'discount'
            ? [...productsWithPrice].sort((a, b) => {
                const discountA =
                  a.compareAtPriceCents && a.compareAtPriceCents > a.priceCents
                    ? (a.compareAtPriceCents - a.priceCents) / a.compareAtPriceCents
                    : 0
                const discountB =
                  b.compareAtPriceCents && b.compareAtPriceCents > b.priceCents
                    ? (b.compareAtPriceCents - b.priceCents) / b.compareAtPriceCents
                    : 0
                return discountB - discountA
              })
            : productsWithPrice

  const t = await getTranslations('store')
  const tCommon = await getTranslations('common')

  // Build breadcrumbs — handle both parent and child categories
  const breadcrumbItems = parent
    ? [
        { label: tCommon('shop'), href: '/' },
        { label: tCommon('categories'), href: '/categories' },
        { label: parent.name, href: `/categories/${parent.slug}` },
        { label: category.name, href: `/categories/${category.slug}`, active: true },
      ]
    : [
        { label: tCommon('shop'), href: '/' },
        { label: tCommon('categories'), href: '/categories' },
        { label: category.name, href: `/categories/${category.slug}`, active: true },
      ]

  // Compute per-tab product counts
  const countBySub = Object.fromEntries(
    subcategories.map((s) => [s.id, products.filter((p) => p.category_id === s.id).length])
  )

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <h1 className="mb-2 text-2xl font-bold text-zinc-50 md:text-3xl">{category.name}</h1>
        {category.description && (
          <p className="mb-6 line-clamp-3 text-zinc-400">{category.description}</p>
        )}

        {/* Subcategory tabs (only for parent categories) */}
        {subcategories.length > 0 && (
          <div className="relative mb-8">
            {/* Right-side fade affordance for horizontal overflow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-zinc-950 to-transparent" />
            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <Link
                href={`/categories/${slug}${sort !== 'newest' ? `?sort=${sort}` : ''}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !activeSub
                    ? 'bg-amber-500 text-black'
                    : 'border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {t('all')} ({products.length})
              </Link>
              {subcategories.map((sub) => {
                const isActive = activeSub?.id === sub.id
                const href = `/categories/${slug}?subcategory=${sub.slug}${sort !== 'newest' ? `&sort=${sort}` : ''}`
                return (
                  <Link
                    key={sub.id}
                    href={href}
                    className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-black'
                        : 'border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {sub.name} ({countBySub[sub.id] ?? 0})
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <Suspense fallback={null}>
          <ScrollOnParamChange />
        </Suspense>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-900" />}>
          <VirtualProductGrid products={sortedProducts} sort={sort} />
        </Suspense>
      </div>
    </div>
  )
}
