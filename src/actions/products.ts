'use server'

import { getProductBySlug, getProductCustomizationRule } from '@/lib/queries'
import { sanitizeProductHtml } from '@/lib/sanitize-html.server'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { getVoteCountsForProducts } from './public-votes'

export type ProductCardStats = {
  timesBought: number
  reviewCount: number
  avgRating: number | null
}

export async function getProductCardStatsMap(
  productIds: string[]
): Promise<Record<string, ProductCardStats>> {
  if (productIds.length === 0) return {}
  const supabase = await createClient()

  const [reviewData, orderItemData] = await Promise.all([
    // reviews: rating + count per product
    supabase
      .from('product_reviews')
      .select('product_id, rating')
      .in('product_id', productIds),
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
    if (!result[row.product_id]) result[row.product_id] = { timesBought: 0, reviewCount: 0, avgRating: null }
    result[row.product_id].reviewCount++
    result[row.product_id].avgRating =
      ((result[row.product_id].avgRating ?? 0) * (result[row.product_id].reviewCount - 1) + row.rating) /
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
}

export async function fetchHomeProducts(
  sortOrOptions: string | FetchHomeProductsOptions = 'newest',
  tag?: string
): Promise<HomeProduct[]> {
  const supabase = await createClient()

  // Normalise arguments: accept either (sort, tag?) or an options object
  let sort: string
  let resolvedTag: string | undefined
  let featured: boolean | undefined
  let limit: number | undefined

  if (typeof sortOrOptions === 'object') {
    sort = sortOrOptions.sort ?? 'newest'
    resolvedTag = sortOrOptions.tag
    featured = sortOrOptions.featured
    limit = sortOrOptions.limit
  } else {
    sort = sortOrOptions
    resolvedTag = tag
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any

  if (resolvedTag) {
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
      .eq('product_tags.tags.slug', resolvedTag)
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
  }

  if (featured !== undefined) {
    query = query.eq('is_featured', featured)
  }

  query = query.order('created_at', { ascending: false })

  if (limit !== undefined) {
    query = query.limit(limit)
  }

  const [productsResult, user, bestsellerIds, wishlistCountData] = await Promise.all([
    query,
    getUserSafe(supabase),
    getBestsellerProductIds(),
    supabase.from('user_wishlist').select('product_id'),
  ])

  const { data: products } = productsResult
  const productIds = ((products ?? []) as ProductRow[]).map((p) => p.id)
  const [publicVoteCounts, cardStats] = await Promise.all([
    getVoteCountsForProducts(productIds),
    getProductCardStatsMap(productIds),
  ])

  // Build wishlist count map: product_id → number of users who liked it
  const likesMap: Record<string, number> = {}
  for (const row of wishlistCountData.data ?? []) {
    likesMap[row.product_id] = (likesMap[row.product_id] ?? 0) + 1
  }

  const wishlistProductIds = user?.id
    ? ((await supabase.from('user_wishlist').select('product_id').eq('user_id', user.id)).data?.map(
        (w) => w.product_id
      ) ?? [])
    : []

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
      imageAlt: primary?.alt ?? p.name,
      imageUrl2: p.dual_image_mode ? (second?.url ?? null) : null,
      dualImageMode: p.dual_image_mode && !!second,
      isInWishlist: wishlistProductIds.includes(p.id),
      isBestseller: bestsellerIds.has(p.id),
      isOnSale: !!(compareAtPriceCents && compareAtPriceCents > priceCents),
      upvotes: likesMap[p.id] ?? 0,
      publicUp: publicVoteCounts[p.id]?.up ?? 0,
      publicDown: publicVoteCounts[p.id]?.down ?? 0,
      timesBought: cardStats[p.id]?.timesBought ?? 0,
      reviewCount: cardStats[p.id]?.reviewCount ?? 0,
      avgRating: cardStats[p.id]?.avgRating ?? null,
    }
  })

  return sort === 'price-asc'
    ? mapped.sort((a, b) => a.priceCents - b.priceCents)
    : sort === 'price-desc'
      ? mapped.sort((a, b) => b.priceCents - a.priceCents)
      : mapped
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
