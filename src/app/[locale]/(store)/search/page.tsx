import { createClient } from '@/lib/supabase/server'
import { searchProducts, type SearchableProduct } from '@/lib/search'
import { SearchResults } from '@/components/search/SearchResults'
import { type FilterableProduct } from '@/lib/product-filtering'
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
      category_id,
      created_at,
      categories (id, name, slug),
      product_images (url, alt, sort_order),
      product_variants (
        id,
        price_cents,
        attributes,
        product_inventory (quantity)
      )
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

  // Transform products to searchable and filterable format
  const searchableProducts: SearchableProduct[] = []
  const filterableProducts: FilterableProduct[] = []
  const categoryMap = new Map<string, { id: string; name: string; count: number }>()

  for (const p of products) {
    const variants = p.product_variants as any[]
    const images = p.product_images as any[]
    const category = Array.isArray(p.categories)
      ? p.categories[0]
      : p.categories as any

    const minPrice = variants?.length
      ? Math.min(...variants.map((v) => v.price_cents))
      : 0

    const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) || []
    const primaryImage = sortedImages[0]

    // Extract colors and sizes from attributes
    const colors = new Set<string>()
    const sizes = new Set<string>()
    let totalStock = 0

    if (variants) {
      for (const variant of variants) {
        // Calculate stock
        const inventory = variant.product_inventory
        if (inventory) {
          const qty = Array.isArray(inventory)
            ? inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
            : inventory.quantity
          totalStock += qty
        }

        // Attributes are in JSONB column
        const attrs = variant.attributes || {}
        const color = attrs.color || attrs.colour
        const size = attrs.size

        if (color) colors.add(color)
        if (size) sizes.add(size)
      }
    }

    // Searchable product
    searchableProducts.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category: category?.name || '',
      tags: [], // TODO: Add tags when tag system is implemented
      priceCents: minPrice,
      imageUrl: primaryImage?.url || '/placeholder.png',
      imageAlt: primaryImage?.alt || p.name,
    })

    // Filterable product
    filterableProducts.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceCents: minPrice,
      categoryId: p.category_id,
      categoryName: category?.name || null,
      colors: Array.from(colors),
      sizes: Array.from(sizes),
      inStock: totalStock > 0,
      imageUrl: primaryImage?.url || null,
      createdAt: p.created_at,
      isBestseller: false, // TODO: Implement bestseller logic
      averageRating: undefined, // TODO: Implement ratings
    })

    // Track categories
    if (category) {
      const existing = categoryMap.get(category.id)
      if (existing) {
        existing.count++
      } else {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          count: 1,
        })
      }
    }
  }

  // Perform search to filter products by query
  const searchResults = searchProducts(searchableProducts, query)
  const searchResultIds = new Set(searchResults.map((r) => r.id))

  // Filter filterable products to match search results
  const filteredProducts = filterableProducts.filter((p) =>
    searchResultIds.has(p.id)
  )

  // Build categories list
  const categories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

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

        {/* Search Results with Filters */}
        <SearchResults
          products={filteredProducts}
          categories={categories}
          query={query}
        />
      </div>
    </div>
  )
}
