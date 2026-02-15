'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ProductGrid } from '@/components/product/ProductGrid'
import { FilterSidebar } from '@/components/filters/FilterSidebar'
import { SortSelector } from '@/components/filters/SortSelector'
import {
  type FilterableProduct,
  type FilterState,
  type SortOption,
  filterProducts,
  sortProducts,
  createInitialFilterState,
  getAvailableFilters,
} from '@/lib/product-filtering'
import { SlidersHorizontal, X } from 'lucide-react'

type Category = {
  id: string
  name: string
  count?: number
}

type Props = {
  products: FilterableProduct[]
  categories: Category[]
  query?: string
  title?: string
}

export function SearchResults({ products, categories, query, title }: Props) {
  const t = useTranslations('search')
  const tFilters = useTranslations('filters')
  // ... state ...
  // State
  const [showFilters, setShowFilters] = useState(false)
  const initialFilters = useMemo(() => createInitialFilterState(products), [products])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Get available filter options
  const availableFilters = useMemo(() => getAvailableFilters(products), [products])

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, filters)
    return sortProducts(filtered, sortBy)
  }, [products, filters, sortBy])

  // Transform to ProductGrid format
  const gridProducts = filteredProducts.map((p) => ({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    imageUrl: p.colors[0] || '/placeholder.png',
    imageAlt: p.name,
    isInWishlist: false,
    isBestseller: p.isBestseller || false,
  }))

  const displayTitle = title || (query ? `${t('resultsFor')}: "${query}"` : t('allProducts'))

  return (
    <div>
      {/* Mobile filter toggle */}
      <div className="mb-6 flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {tFilters('filters')}
        </button>
        <SortSelector value={sortBy} onChange={setSortBy} />
      </div>

      <div className="grid gap-8 md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden md:block">
          <div className="sticky top-20">
            <FilterSidebar
              categories={categories}
              colors={availableFilters.colors}
              sizes={availableFilters.sizes}
              priceRange={availableFilters.priceRange}
              filters={filters}
              initialFilters={initialFilters}
              onFilterChange={setFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main>
          {/* Header with sort */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-zinc-50">
                {displayTitle}
              </h1>
              <p className="text-sm text-zinc-400">
                {filteredProducts.length === 0
                  ? t('noResults')
                  : filteredProducts.length === 1
                    ? t('oneResult')
                    : t('resultsCount', { count: filteredProducts.length })}
              </p>
            </div>
            <div className="hidden md:block">
              <SortSelector value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Results */}
          {filteredProducts.length > 0 ? (
            <ProductGrid
              products={gridProducts}
              title={t('results')}
            />
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <h2 className="mb-4 text-xl font-semibold text-zinc-50">
                {t('noResultsTitle')}
              </h2>
              <p className="mb-6 text-zinc-400">{t('noResultsMessage')}</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-black p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-50">{tFilters('filters')}</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar
              categories={categories}
              colors={availableFilters.colors}
              sizes={availableFilters.sizes}
              priceRange={availableFilters.priceRange}
              filters={filters}
              initialFilters={initialFilters}
              onFilterChange={(newFilters) => {
                setFilters(newFilters)
                setShowFilters(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
