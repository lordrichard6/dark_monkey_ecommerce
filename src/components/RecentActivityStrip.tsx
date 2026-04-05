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

// ---------------------------------------------------------------------------
// Cached data fetch — uses admin client (no cookies), safe inside unstable_cache
// Refreshes every 5 minutes
// ---------------------------------------------------------------------------

const getCachedActivity = unstable_cache(
  async (): Promise<ActivityItem[]> => {
    try {
      const supabase = getAdminClient()
      if (!supabase) return []

      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

      const [purchasesResult, reviewsResult] = await Promise.all([
        supabase
          .from('recent_purchases')
          .select('id, location, purchased_at, products(name)')
          .gte('purchased_at', since)
          .order('purchased_at', { ascending: false })
          .limit(5),

        supabase
          .from('product_reviews')
          .select('id, rating, reviewer_display_name, created_at, products(name)')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const items: ActivityItem[] = []

      if (purchasesResult.data) {
        for (const row of purchasesResult.data) {
          const product =
            row.products && !Array.isArray(row.products)
              ? (row.products as { name: string }).name
              : Array.isArray(row.products) && row.products.length > 0
                ? (row.products[0] as { name: string }).name
                : 'a product'

          const location = row.location as string | null
          const ageMs = Date.now() - new Date(row.purchased_at as string).getTime()
          const ageMins = Math.floor(ageMs / 60000)
          const subtext =
            ageMins < 1
              ? 'just now'
              : ageMins < 60
                ? `${ageMins}m ago`
                : `${Math.floor(ageMins / 60)}h ago`

          items.push({
            id: `purchase-${row.id}`,
            type: 'purchase',
            text: location ? `${location} · ${product}` : product,
            subtext,
          })
        }
      }

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
          const ageMs = Date.now() - new Date(row.created_at as string).getTime()
          const ageMins = Math.floor(ageMs / 60000)
          const subtext =
            ageMins < 1
              ? 'just now'
              : ageMins < 60
                ? `${ageMins}m ago`
                : `${Math.floor(ageMins / 60)}h ago`

          items.push({
            id: `review-${row.id}`,
            type: 'review',
            text: `${reviewer} · ${rating}★ on ${product}`,
            subtext,
          })
        }
      }

      // Interleave purchases and reviews by merging sorted by recency
      items.sort(() => Math.random() - 0.5) // light shuffle for variety
      return items.slice(0, 8)
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

        {/* Horizontally scrollable pill row — pure CSS, zero JS */}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5"
            >
              {/* Icon */}
              <span className="text-sm leading-none" aria-hidden>
                {item.type === 'purchase' ? '🛒' : '⭐'}
              </span>

              {/* Text */}
              <span className="max-w-[180px] truncate text-xs text-zinc-300">{item.text}</span>

              {/* Time */}
              <span className="shrink-0 text-[10px] text-zinc-600">{item.subtext}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
