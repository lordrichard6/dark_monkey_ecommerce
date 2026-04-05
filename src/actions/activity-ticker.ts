'use server'

import { createClient } from '@/lib/supabase/server'

export type ActivityEventType = 'purchase' | 'review' | 'like'

export type ActivityEvent = {
  id: string
  type: ActivityEventType
  text: string
  subtext?: string
  timestamp: string
}

function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins === 1) return '1 minute ago'
  if (diffMins < 60) return `${diffMins} minutes ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`

  return 'today'
}

export async function getRecentActivity(limit = 8): Promise<ActivityEvent[]> {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const half = Math.ceil(limit / 2)

    const [purchasesResult, reviewsResult] = await Promise.all([
      supabase
        .from('recent_purchases')
        .select('id, location, purchased_at, product_id, products(name)')
        .gte('purchased_at', since)
        .order('purchased_at', { ascending: false })
        .limit(half),

      supabase
        .from('product_reviews')
        .select('id, rating, reviewer_display_name, created_at, product_id, products(name)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(half),
    ])

    const events: ActivityEvent[] = []

    if (purchasesResult.data) {
      for (const row of purchasesResult.data) {
        const productName =
          row.products && !Array.isArray(row.products)
            ? (row.products as { name: string }).name
            : Array.isArray(row.products) && row.products.length > 0
              ? (row.products[0] as { name: string }).name
              : 'a product'

        const location = row.location as string | null
        events.push({
          id: `purchase-${row.id}`,
          type: 'purchase',
          text: `Someone${location ? ` in ${location}` : ''} just bought ${productName}`,
          subtext: getTimeAgo(row.purchased_at as string),
          timestamp: row.purchased_at as string,
        })
      }
    }

    if (reviewsResult.data) {
      for (const row of reviewsResult.data) {
        const productName =
          row.products && !Array.isArray(row.products)
            ? (row.products as { name: string }).name
            : Array.isArray(row.products) && row.products.length > 0
              ? (row.products[0] as { name: string }).name
              : 'a product'

        const reviewer = (row.reviewer_display_name as string | null) || 'Someone'
        const rating = row.rating as number
        events.push({
          id: `review-${row.id}`,
          type: 'review',
          text: `${reviewer} left a ${rating}★ review on ${productName}`,
          subtext: getTimeAgo(row.created_at as string),
          timestamp: row.created_at as string,
        })
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return events.slice(0, limit)
  } catch {
    return []
  }
}
