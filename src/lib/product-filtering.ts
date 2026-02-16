/**
 * Product Filtering & Sorting Logic
 *
 * Provides utilities for filtering and sorting products by various criteria:
 * - Price range
 * - Categories
 * - Colors
 * - Sizes
 * - Stock availability
 * - Sorting (price, date, bestseller, rating)
 */

export type FilterState = {
  priceMin: number
  priceMax: number
  categories: string[]
  colors: string[]
  sizes: string[]
  inStockOnly: boolean
}

export type SortOption =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'bestseller'
  | 'rating'

export type FilterableProduct = {
  id: string
  name: string
  slug: string
  priceCents: number
  categoryId: string | null
  categoryName: string | null
  colors: string[]
  sizes: string[]
  inStock: boolean
  imageUrl: string | null
  createdAt: string
  isBestseller?: boolean
  averageRating?: number
}

/**
 * Apply filters to a list of products
 */
export function filterProducts(
  products: FilterableProduct[],
  filters: FilterState
): FilterableProduct[] {
  return products.filter((product) => {
    // Price filter
    if (product.priceCents < filters.priceMin || product.priceCents > filters.priceMax) {
      return false
    }

    // Category filter
    if (filters.categories.length > 0 && product.categoryId) {
      if (!filters.categories.includes(product.categoryId)) {
        return false
      }
    }

    // Color filter
    if (filters.colors.length > 0) {
      const hasMatchingColor = product.colors.some((color) =>
        filters.colors.includes(color.toLowerCase())
      )
      if (!hasMatchingColor) {
        return false
      }
    }

    // Size filter
    if (filters.sizes.length > 0) {
      const hasMatchingSize = product.sizes.some((size) =>
        filters.sizes.includes(size.toUpperCase())
      )
      if (!hasMatchingSize) {
        return false
      }
    }

    // Stock filter
    if (filters.inStockOnly && !product.inStock) {
      return false
    }

    return true
  })
}

/**
 * Sort products by specified criteria
 */
export function sortProducts(
  products: FilterableProduct[],
  sortBy: SortOption
): FilterableProduct[] {
  const sorted = [...products]

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.priceCents - b.priceCents)

    case 'price-desc':
      return sorted.sort((a, b) => b.priceCents - a.priceCents)

    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    case 'bestseller':
      return sorted.sort((a, b) => {
        if (a.isBestseller && !b.isBestseller) return -1
        if (!a.isBestseller && b.isBestseller) return 1
        return 0
      })

    case 'rating':
      return sorted.sort((a, b) => {
        const ratingA = a.averageRating ?? 0
        const ratingB = b.averageRating ?? 0
        return ratingB - ratingA
      })

    default:
      return sorted
  }
}

/**
 * Get available filter options from products
 * Useful for dynamically showing only relevant filters
 */
export function getAvailableFilters(products: FilterableProduct[]): {
  priceRange: { min: number; max: number }
  colors: string[]
  sizes: string[]
} {
  const prices = products.map((p) => p.priceCents)
  const allColors = products.flatMap((p) => p.colors)
  const allSizes = products.flatMap((p) => p.sizes)

  return {
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
    },
    colors: Array.from(new Set(allColors)).sort(),
    sizes: Array.from(new Set(allSizes)).sort(),
  }
}

/**
 * Create initial filter state
 */
export function createInitialFilterState(
  products: FilterableProduct[]
): FilterState {
  const { priceRange } = getAvailableFilters(products)

  return {
    priceMin: priceRange.min,
    priceMax: priceRange.max,
    categories: [],
    colors: [],
    sizes: [],
    inStockOnly: false,
  }
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(
  filters: FilterState,
  initialFilters: FilterState
): boolean {
  return (
    filters.priceMin !== initialFilters.priceMin ||
    filters.priceMax !== initialFilters.priceMax ||
    filters.categories.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.inStockOnly
  )
}
