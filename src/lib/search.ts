import Fuse from 'fuse.js'

export type SearchableProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  tags: string[]
  priceCents: number
  imageUrl: string
  imageAlt: string
}

/**
 * Search products using Fuse.js fuzzy search
 *
 * Features:
 * - Fuzzy matching (typo-tolerance)
 * - Weighted search (name > category > description)
 * - Configurable threshold
 *
 * @param products - Array of searchable products
 * @param query - Search query string
 * @returns Filtered products sorted by relevance
 */
export function searchProducts(
  products: SearchableProduct[],
  query: string
): SearchableProduct[] {
  // Return all products if query is empty
  if (!query.trim()) return products

  const fuse = new Fuse(products, {
    keys: [
      { name: 'name', weight: 2 }, // Product name is most important
      { name: 'category', weight: 1.5 }, // Category is quite important
      { name: 'description', weight: 1 }, // Description is helpful
      { name: 'tags', weight: 1 }, // Tags are helpful
    ],
    threshold: 0.3, // 0 = perfect match, 1 = match anything (0.3 = good balance)
    includeScore: true,
    minMatchCharLength: 2, // Require at least 2 characters to match
    ignoreLocation: true, // Search anywhere in the string
  })

  const results = fuse.search(query)
  return results.map((result) => result.item)
}

/**
 * Get search suggestions based on partial query
 * Returns top 5 matching product names
 */
export function getSearchSuggestions(
  products: SearchableProduct[],
  query: string,
  limit = 5
): string[] {
  if (!query.trim() || query.length < 2) return []

  const results = searchProducts(products, query)
  return results
    .slice(0, limit)
    .map((p) => p.name)
    .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
}
