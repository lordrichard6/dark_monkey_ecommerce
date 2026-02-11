import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { ReviewRow } from '@/components/reviews/ProductReviews'

/**
 * Cached Database Queries
 *
 * Uses React cache() to deduplicate database queries within a single request.
 * When the same query is called multiple times (e.g., in generateMetadata and page component),
 * only one database call is made.
 *
 * Benefits:
 * - Reduces database load
 * - Faster page rendering
 * - Automatic request-scoped caching
 */

/**
 * Get product by slug with all related data
 * Used in product pages - caches across generateMetadata and page component
 */
export const getProductBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      is_customizable,
      category_id,
      story_content,
      categories (name, slug),
      product_images (url, alt, sort_order, color),
      product_variants (
        id,
        name,
        price_cents,
        attributes,
        sort_order,
        product_inventory (quantity)
      )
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  return { data: product, error }
})

/**
 * Get basic product info (for metadata)
 * Lightweight version for metadata generation
 */
export const getProductMetadata = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return product
})

/**
 * Get product reviews
 * Caches review queries for product pages
 */
export const getProductReviews = cache(async (productId: string) => {
  const supabase = await createClient()

  const { data: reviewsData } = await supabase
    .from('product_reviews')
    .select('id, rating, comment, reviewer_display_name, order_id, created_at, photos')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  return (reviewsData ?? []) as ReviewRow[]
})

/**
 * Get user's review for a product
 * Caches user review lookups
 */
export const getUserProductReview = cache(async (productId: string, userId: string) => {
  const supabase = await createClient()

  const { data: userReviewRow } = await supabase
    .from('product_reviews')
    .select('id, rating, comment, reviewer_display_name, order_id, created_at, photos')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle()

  return userReviewRow as ReviewRow | null
})

/**
 * Get customization rules for a product
 * Caches customization rule lookups
 */
export const getProductCustomizationRule = cache(async (productId: string) => {
  const supabase = await createClient()

  const { data: rule } = await supabase
    .from('customization_rules')
    .select('rule_def')
    .eq('product_id', productId)
    .single()

  return rule
})

/**
 * Check if product is in user's wishlist
 * Caches wishlist checks
 */
export const isProductInWishlist = cache(async (productId: string, userId: string) => {
  const supabase = await createClient()

  const { data: wishlistRow } = await supabase
    .from('user_wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  return !!wishlistRow
})

/**
 * Get category by slug with products
 * Used in category pages
 */
export const getCategoryBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: category, error } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .single()

  if (error || !category) {
    return { data: null, error }
  }

  const { data: products } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      category_id,
      product_images (url, alt, sort_order),
      product_variants (price_cents, product_inventory (quantity))
    `
    )
    .eq('category_id', category.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return { data: { category, products: products ?? [] }, error: null }
})

/**
 * Get all active categories
 * Used in category listings and navigation
 */
export const getActiveCategories = cache(async () => {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('name')

  return categories ?? []
})

/**
 * Get user's wishlist product IDs
 * Caches user wishlist lookups
 */
export const getUserWishlistProductIds = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_wishlist')
    .select('product_id')
    .eq('user_id', userId)

  return data?.map((w) => w.product_id) ?? []
})

/**
 * Get category metadata (for generateMetadata)
 * Lightweight version for metadata generation
 */
export const getCategoryMetadata = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  return category
})
