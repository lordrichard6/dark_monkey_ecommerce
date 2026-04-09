import { getAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'

const COMPLETED_ORDER_STATUSES = ['paid', 'processing', 'shipped', 'delivered'] as const
const TOP_N = 10

async function _getBestsellerProductIds(): Promise<string[]> {
  const supabase = getAdminClient()
  if (!supabase) return []

  const { data: orderIds } = await supabase
    .from('orders')
    .select('id')
    .in('status', [...COMPLETED_ORDER_STATUSES])
  const ids = orderIds?.map((o) => o.id) ?? []
  if (ids.length === 0) return []

  const { data: items } = await supabase
    .from('order_items')
    .select('variant_id, quantity')
    .in('order_id', ids)
  if (!items?.length) return []

  const variantIds = [...new Set(items.map((i) => i.variant_id))]
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .in('id', variantIds)
  const variantToProduct = new Map<string, string>(
    (variants ?? []).map((v) => [v.id, v.product_id])
  )

  const soldByProduct = new Map<string, number>()
  for (const item of items) {
    const productId = variantToProduct.get(item.variant_id)
    if (!productId) continue
    soldByProduct.set(productId, (soldByProduct.get(productId) ?? 0) + item.quantity)
  }

  return [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([id]) => id)
}

// Cached for 5 minutes — bestseller ranks change slowly
const getCachedBestsellerIds = unstable_cache(
  _getBestsellerProductIds,
  ['bestseller-product-ids'],
  { revalidate: 300 }
)

/**
 * Returns product IDs that are bestsellers (most units sold in completed orders).
 * Cached for 5 minutes to avoid repeated heavy multi-join queries.
 */
export async function getBestsellerProductIds(): Promise<Set<string>> {
  const ids = await getCachedBestsellerIds()
  return new Set(ids)
}
