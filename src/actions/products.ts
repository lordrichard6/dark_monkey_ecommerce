'use server'

import { getProductBySlug, getProductCustomizationRule } from '@/lib/queries'
import { sanitizeProductHtml } from '@/lib/sanitize-html.server'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { getVoteCountsForProducts } from './public-votes'
import { unstable_cache } from 'next/cache'
import { buildProductImageAlt } from '@/lib/product-image-alt'

export type ProductCardStats = {
  timesBought: number
  reviewCount: number
  avgRating: number | null
}

export async function getProductCardStatsMap(
  productIds: string[]
): Promise<Record<string, ProductCardStats>> {
  if (productIds.length === 0) return {}
  // Use admin client — public stats, safe inside unstable_cache
  const supabase = getAdminClient() ?? (await createClient())

  const [reviewData, orderItemData] = await Promise.all([
    // reviews: rating + count per product
    supabase.from('product_reviews').select('product_id, rating').in('product_id', productIds),
    // order_items joined with paid orders via product_variants for product_id
    supabase
      .from('order_items')
      .select('quantity, orders!inner(status), product_variants!inner(product_id)')
      .eq('orders.status', 'paid')
      .in('product_variants.product_id', productIds),
  ])

  const result: Record<string, ProductCardStats> = {}

  // Build review stats
  for (const row of reviewData.data ?? []) {
    if (!result[row.product_id])
      result[row.product_id] = { timesBought: 0, reviewCount: 0, avgRating: null }
    result[row.product_id].reviewCount++
    result[row.product_id].avgRating =
      ((result[row.product_id].avgRating ?? 0) * (result[row.product_id].reviewCount - 1) +
        row.rating) /
      result[row.product_id].reviewCount
  }

  // Build sales stats (product_id comes via product_variants join)
  for (const row of orderItemData.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productId = (row as any).product_variants?.product_id
    if (!productId) continue
    if (!result[productId]) result[productId] = { timesBought: 0, reviewCount: 0, avgRating: null }
    result[productId].timesBought += row.quantity ?? 1
  }

  return result
}

type ProductRow = {
  id: string
  name: string
  slug: string
  category_id: string | null
  dual_image_mode: boolean
  product_images: { url: string; alt: string | null; sort_order: number }[] | null
  product_variants: { price_cents: number; compare_at_price_cents: number | null }[] | null
}

export type HomeProduct = {
  productId: string
  slug: string
  name: string
  categoryId: string | undefined
  priceCents: number
  compareAtPriceCents: number | null
  imageUrl: string
  imageAlt: string
  imageUrl2: string | null
  dualImageMode: boolean
  isInWishlist: boolean
  isBestseller: boolean
  isOnSale: boolean
  upvotes: number
  publicUp: number
  publicDown: number
  timesBought: number
  reviewCount: number
  avgRating: number | null
}

type FetchHomeProductsOptions = {
  sort?: string
  tag?: string
  featured?: boolean
  limit?: number
  categoryIds?: string[]
}

// ---------------------------------------------------------------------------
// Public (non-user-specific) product data — safe to cache across requests.
// Wishlist per-user data is merged on top in fetchHomeProducts().
// ---------------------------------------------------------------------------

type PublicHomeProduct = Omit<HomeProduct, 'isInWishlist'>

async function _fetchPublicHomeProducts(
  sort: string,
  tag: string | undefined,
  featured: boolean | undefined,
  limit: number | undefined,
  categoryIds: string[] | undefined
): Promise<PublicHomeProduct[]> {
  // Use admin client — no cookies needed for public product data
  const supabase = getAdminClient()
  if (!supabase) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any

  if (tag) {
    query = supabase
      .from('products')
      .select(
        `id, name, slug, category_id, dual_image_mode,
         product_images (url, alt, sort_order),
         product_variants (price_cents, compare_at_price_cents),
         product_tags!inner (tags!inner (slug))`
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('is_exclusive', false)
      .eq('product_tags.tags.slug', tag)
  } else {
    query = supabase
      .from('products')
      .select(
        `id, name, slug, category_id, dual_image_mode,
         product_images (url, alt, sort_order),
         product_variants (price_cents, compare_at_price_cents)`
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('is_exclusive', false)
  }

  if (featured !== undefined) query = query.eq('is_featured', featured)
  if (categoryIds && categoryIds.length > 0) query = query.in('category_id', categoryIds)
  query = query.order('created_at', { ascending: false })
  if (limit !== undefined) query = query.limit(limit)

  const [productsResult, bestsellerIds] = await Promise.all([query, getBestsellerProductIds()])

  const { data: products } = productsResult
  const productIds = ((products ?? []) as ProductRow[]).map((p) => p.id)

  const [publicVoteCounts, cardStats] = await Promise.all([
    getVoteCountsForProducts(productIds),
    getProductCardStatsMap(productIds),
  ])

  const mapped = ((products ?? []) as ProductRow[]).map((p) => {
    const variants = p.product_variants
    const images = p.product_images

    let priceCents = 0
    let compareAtPriceCents: number | null = null

    if (variants && variants.length > 0) {
      const sorted = [...variants].sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0))
      priceCents = sorted[0].price_cents || 0
      compareAtPriceCents = sorted[0].compare_at_price_cents || null
    }

    const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) ?? []
    const primary = sortedImages[0]
    const second = sortedImages[1]

    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      categoryId: p.category_id ?? undefined,
      priceCents,
      compareAtPriceCents,
      imageUrl: primary?.url ?? '',
      imageAlt: buildProductImageAlt(p.name, primary?.alt),
      imageUrl2: p.dual_image_mode ? (second?.url ?? null) : null,
      dualImageMode: p.dual_image_mode && !!second,
      isBestseller: bestsellerIds.has(p.id),
      isOnSale: !!(compareAtPriceCents && compareAtPriceCents > priceCents),
      upvotes: 0, // likes are user-wishlist count — omitted from cache
      publicUp: publicVoteCounts[p.id]?.up ?? 0,
      publicDown: publicVoteCounts[p.id]?.down ?? 0,
      timesBought: cardStats[p.id]?.timesBought ?? 0,
      reviewCount: cardStats[p.id]?.reviewCount ?? 0,
      avgRating: cardStats[p.id]?.avgRating ?? null,
    } satisfies PublicHomeProduct
  })

  return sort === 'price-asc'
    ? mapped.sort((a, b) => a.priceCents - b.priceCents)
    : sort === 'price-desc'
      ? mapped.sort((a, b) => b.priceCents - a.priceCents)
      : mapped
}

// Cache key encodes all query params so different calls get different buckets.
// Revalidates every 3 minutes — products change infrequently on the homepage.
function getCachedPublicHomeProducts(
  sort: string,
  tag: string | undefined,
  featured: boolean | undefined,
  limit: number | undefined,
  categoryIds: string[] | undefined
): Promise<PublicHomeProduct[]> {
  const catKey = categoryIds?.length ? categoryIds.sort().join(',') : 'all'
  const key = `home-products-${sort}-${tag ?? 'all'}-${featured ?? 'any'}-${limit ?? 'nolimit'}-${catKey}`
  return unstable_cache(
    () => _fetchPublicHomeProducts(sort, tag, featured, limit, categoryIds),
    [key],
    { revalidate: 180 }
  )()
}

export async function fetchHomeProducts(
  sortOrOptions: string | FetchHomeProductsOptions = 'newest',
  tag?: string
): Promise<HomeProduct[]> {
  // Normalise arguments
  let sort: string
  let resolvedTag: string | undefined
  let featured: boolean | undefined
  let limit: number | undefined
  let categoryIds: string[] | undefined

  if (typeof sortOrOptions === 'object') {
    sort = sortOrOptions.sort ?? 'newest'
    resolvedTag = sortOrOptions.tag
    featured = sortOrOptions.featured
    limit = sortOrOptions.limit
    categoryIds = sortOrOptions.categoryIds
  } else {
    sort = sortOrOptions
    resolvedTag = tag
  }

  // Fetch cached public data + per-user wishlist in parallel
  const supabase = await createClient()
  const [publicProducts, user] = await Promise.all([
    getCachedPublicHomeProducts(sort, resolvedTag, featured, limit, categoryIds),
    getUserSafe(supabase),
  ])

  // Scope wishlist to current user only (was previously fetching ALL rows)
  const wishlistProductIds = user?.id
    ? ((await supabase.from('user_wishlist').select('product_id').eq('user_id', user.id)).data?.map(
        (w) => w.product_id
      ) ?? [])
    : []

  return publicProducts.map((p) => ({
    ...p,
    isInWishlist: wishlistProductIds.includes(p.productId),
  }))
}

/** Fetch products for a specific category (+ its subcategories) — called from client on filter change. */
export async function fetchProductsByCategory(
  categoryIds: string[],
  limit = 10
): Promise<HomeProduct[]> {
  return fetchHomeProducts({ categoryIds, limit, sort: 'newest' })
}

/**
 * Hero picks — admin-curated products for the homepage hero (max 2).
 *
 * Resolution order (each is independent — first non-empty wins, then we top up
 * to 2 with the next source so the hero is **never empty**):
 *   1. `hero_picks` table, ordered by sort_order ASC then created_at DESC
 *   2. `is_featured = true`, newest first
 *   3. Newest active products
 *
 * Returns at most 2 distinct products. Pure server-side, deduplicated by id.
 */
export async function fetchHeroProducts(): Promise<HomeProduct[]> {
  const HERO_LIMIT = 2
  const adminClient = getAdminClient()

  // 1. Pull admin-picked product ids
  let pickedIds: string[] = []
  if (adminClient) {
    const { data } = await adminClient
      .from('hero_picks')
      .select('product_id, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(HERO_LIMIT)
    pickedIds = (data ?? []).map((row) => row.product_id)
  }

  const seen = new Set<string>()
  const result: HomeProduct[] = []

  // Resolve picked ids by direct query (preserves admin-defined order)
  if (pickedIds.length > 0 && adminClient) {
    const { data: rows } = await adminClient
      .from('products')
      .select(
        `id, name, slug, category_id, dual_image_mode,
         product_images (url, alt, sort_order),
         product_variants (price_cents, compare_at_price_cents)`
      )
      .in('id', pickedIds)
      .eq('is_active', true)
      .is('deleted_at', null)

    const [bestsellerSet, voteCounts, cardStats] = await Promise.all([
      getBestsellerProductIds(),
      getVoteCountsForProducts(pickedIds),
      getProductCardStatsMap(pickedIds),
    ])

    const orderMap = new Map(pickedIds.map((id, i) => [id, i]))
    const ordered = ((rows ?? []) as ProductRow[])
      .slice()
      .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))

    for (const p of ordered) {
      if (seen.has(p.id)) continue
      const variants = p.product_variants
      const images = p.product_images

      let priceCents = 0
      let compareAtPriceCents: number | null = null
      if (variants && variants.length > 0) {
        const sorted = [...variants].sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0))
        priceCents = sorted[0].price_cents || 0
        compareAtPriceCents = sorted[0].compare_at_price_cents || null
      }

      const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) ?? []
      const primary = sortedImages[0]
      const second = sortedImages[1]

      result.push({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        categoryId: p.category_id ?? undefined,
        priceCents,
        compareAtPriceCents,
        imageUrl: primary?.url ?? '',
        imageAlt: buildProductImageAlt(p.name, primary?.alt),
        imageUrl2: p.dual_image_mode ? (second?.url ?? null) : null,
        dualImageMode: p.dual_image_mode && !!second,
        isBestseller: bestsellerSet.has(p.id),
        isOnSale: !!(compareAtPriceCents && compareAtPriceCents > priceCents),
        upvotes: 0,
        publicUp: voteCounts[p.id]?.up ?? 0,
        publicDown: voteCounts[p.id]?.down ?? 0,
        timesBought: cardStats[p.id]?.timesBought ?? 0,
        reviewCount: cardStats[p.id]?.reviewCount ?? 0,
        avgRating: cardStats[p.id]?.avgRating ?? null,
        isInWishlist: false,
      })
      seen.add(p.id)
    }
  }

  // 2. Top up from featured products if we still need slots
  if (result.length < HERO_LIMIT) {
    const featured = await fetchHomeProducts({ featured: true, limit: HERO_LIMIT * 2 })
    for (const p of featured) {
      if (result.length >= HERO_LIMIT) break
      if (seen.has(p.productId)) continue
      result.push(p)
      seen.add(p.productId)
    }
  }

  // 3. Top up from newest as last resort
  if (result.length < HERO_LIMIT) {
    const newest = await fetchHomeProducts({ sort: 'newest', limit: HERO_LIMIT * 2 })
    for (const p of newest) {
      if (result.length >= HERO_LIMIT) break
      if (seen.has(p.productId)) continue
      result.push(p)
      seen.add(p.productId)
    }
  }

  return result.slice(0, HERO_LIMIT)
}

export async function getProductQuickView(slug: string) {
  const { data, error } = await getProductBySlug(slug)

  if (error || !data) {
    return { error: 'Product not found' }
  }

  let customizationRule = null
  if (data.is_customizable) {
    customizationRule = await getProductCustomizationRule(data.id)
  }

  return {
    data: {
      ...data,
      description: sanitizeProductHtml(data.description),
    },
    customizationRule,
  }
}
