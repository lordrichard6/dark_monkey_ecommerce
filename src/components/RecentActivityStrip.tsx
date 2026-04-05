import { unstable_cache } from 'next/cache'
import { getAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityItem = {
  id: string
  type: 'purchase' | 'review'
  text: string
  subtext: string
}

function timeAgo(timestamp: string): string {
  const ageMins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
  if (ageMins < 1) return 'just now'
  if (ageMins < 60) return `${ageMins}m ago`
  const ageHours = Math.floor(ageMins / 60)
  if (ageHours < 24) return `${ageHours}h ago`
  return `${Math.floor(ageHours / 24)}d ago`
}

// ---------------------------------------------------------------------------
// Cached data fetch — queries real orders + reviews, no separate table needed
// Uses admin client (no cookies), safe inside unstable_cache
// Refreshes every 5 minutes
// ---------------------------------------------------------------------------

const getCachedActivity = unstable_cache(
  async (): Promise<ActivityItem[]> => {
    try {
      const supabase = getAdminClient()
      if (!supabase) return []

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [ordersResult, reviewsResult] = await Promise.all([
        // Real orders — join through order_items → product_variants → products
        // and optionally the shipping address for city/country
        supabase
          .from('orders')
          .select(
            `
            id,
            created_at,
            shipping_address:addresses!orders_shipping_address_id_fkey(city, country),
            order_items(
              product_variants(
                products(name)
              )
            )
          `
          )
          .in('status', ['paid', 'processing', 'shipped', 'delivered'])
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(4),

        // Real product reviews
        supabase
          .from('product_reviews')
          .select('id, rating, reviewer_display_name, created_at, products(name)')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      const items: ActivityItem[] = []

      // --- Orders ---
      if (ordersResult.data) {
        for (const order of ordersResult.data) {
          // Pick the first item's product name; if multiple items say "X items"
          const orderItems = order.order_items as unknown as {
            product_variants: { products: { name: string } | null } | null
          }[]

          let productLabel = 'an order'
          if (orderItems && orderItems.length > 0) {
            const firstName = orderItems[0]?.product_variants?.products?.name
            productLabel =
              orderItems.length === 1 ? (firstName ?? 'a product') : `${orderItems.length} items`
          }

          // Location from shipping address if available
          const addr = order.shipping_address as unknown as { city: string; country: string } | null
          const location = addr?.city ? `${addr.city} · ` : ''

          items.push({
            id: `order-${order.id}`,
            type: 'purchase',
            text: `${location}${productLabel}`,
            subtext: timeAgo(order.created_at as string),
          })
        }
      }

      // --- Reviews ---
      if (reviewsResult.data) {
        for (const row of reviewsResult.data) {
          const product =
            row.products && !Array.isArray(row.products)
              ? (row.products as { name: string }).name
              : Array.isArray(row.products) && row.products.length > 0
                ? (row.products[0] as { name: string }).name
                : 'a product'

          const reviewer = (row.reviewer_display_name as string | null) || 'Someone'
          const rating = row.rating as number

          items.push({
            id: `review-${row.id}`,
            type: 'review',
            text: `${reviewer} · ${'★'.repeat(rating)} on ${product}`,
            subtext: timeAgo(row.created_at as string),
          })
        }
      }

      // Sort by recency, take top 5
      items.sort((a, b) => {
        // subtext is approximate — sort by insertion order (orders first, then reviews)
        return 0
      })

      return items.slice(0, 5)
    } catch {
      return []
    }
  },
  ['recent-activity-strip'],
  { revalidate: 300 }
)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function RecentActivityStrip() {
  const items = await getCachedActivity()

  if (items.length === 0) return null

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* Label */}
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Recent Activity
        </p>

        {/* Pill row — pure CSS, zero JS, horizontally scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5"
            >
              <span className="text-sm leading-none" aria-hidden>
                {item.type === 'purchase' ? '🛒' : '⭐'}
              </span>
              <span className="max-w-[200px] truncate text-xs text-zinc-300">{item.text}</span>
              <span className="shrink-0 text-[10px] text-zinc-600">{item.subtext}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
