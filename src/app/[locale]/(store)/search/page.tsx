import { createClient } from '@/lib/supabase/server'
import { searchProducts, type SearchableProduct } from '@/lib/search'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q: query } = await searchParams

  if (!query) {
    return {
      title: 'Search',
      description: 'Search for products',
    }
  }

  return {
    title: `Search: ${query}`,
    description: `Search results for "${query}"`,
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: query } = await searchParams
  const t = await getTranslations('search')
  const tCommon = await getTranslations('common')

  // If no query, show empty state
  if (!query || !query.trim()) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-zinc-50">
            {t('title')}
          </h1>
          <p className="text-zinc-400">
            {t('enterQuery')}
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
          >
            {tCommon('browseProducts')}
          </Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch all active products with their data
  const { data: products, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      categories (name, slug),
      product_images (url, alt, sort_order),
      product_variants (price_cents, product_inventory (quantity))
    `
    )
    .eq('is_active', true)
    .is('deleted_at', null)

  if (error || !products) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-zinc-50">
            {t('errorTitle')}
          </h1>
          <p className="text-zinc-400">{t('errorMessage')}</p>
        </div>
      </div>
    )
  }

  // Transform products to searchable format
  const searchableProducts: SearchableProduct[] = products.map((p) => {
    const variants = p.product_variants as Array<{
      price_cents: number
      product_inventory: Array<{ quantity: number }> | { quantity: number }
    }> | null

    const images = p.product_images as Array<{
      url: string
      alt: string | null
      sort_order: number
    }> | null

    const categories = Array.isArray(p.categories)
      ? p.categories[0]
      : p.categories as { name: string; slug: string } | null

    const minPrice = variants?.length
      ? Math.min(...variants.map((v) => v.price_cents))
      : 0

    const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) || []
    const primaryImage = sortedImages[0]

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category: categories?.name || '',
      tags: [], // TODO: Add tags when tag system is implemented
      priceCents: minPrice,
      imageUrl: primaryImage?.url || '/placeholder.png',
      imageAlt: primaryImage?.alt || p.name,
    }
  })

  // Perform search
  const results = searchProducts(searchableProducts, query)

  // Track search query (optional - for analytics)
  // TODO: Implement search analytics in Phase 10 later
  // await supabase.from('search_queries').insert({
  //   query: query.trim(),
  //   results_count: results.length,
  // })

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            {tCommon('shop')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">{t('searchResults')}</span>
        </nav>

        {/* Search header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t('resultsFor')}: "{query}"
          </h1>
          <p className="text-zinc-400">
            {results.length === 0
              ? t('noResults')
              : results.length === 1
                ? t('oneResult')
                : t('resultsCount', { count: results.length })}
          </p>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ProductGrid
            products={results.map((r) => ({
              productId: r.id,
              slug: r.slug,
              name: r.name,
              priceCents: r.priceCents,
              imageUrl: r.imageUrl,
              imageAlt: r.imageAlt,
              isInWishlist: false, // TODO: Check wishlist status
              isBestseller: false, // TODO: Check bestseller status
            }))}
            title={t('results')}
          />
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <h2 className="mb-4 text-xl font-semibold text-zinc-50">
              {t('noResultsTitle')}
            </h2>
            <p className="mb-6 text-zinc-400">{t('noResultsMessage')}</p>

            {/* Suggestions */}
            <div className="mb-8 text-left">
              <p className="mb-3 text-sm font-medium text-zinc-300">
                {t('suggestions')}:
              </p>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• {t('suggestionSpelling')}</li>
                <li>• {t('suggestionKeywords')}</li>
                <li>• {t('suggestionGeneral')}</li>
              </ul>
            </div>

            {/* Browse categories */}
            <Link
              href="/categories"
              className="inline-block rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
            >
              {t('browseCategories')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
