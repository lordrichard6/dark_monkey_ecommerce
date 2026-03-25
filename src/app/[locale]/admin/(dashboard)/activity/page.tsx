import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { ActivityFeed } from './activity-feed'
import { RefreshButton } from './refresh-button'

export type ActivityEvent = {
  id: string
  type: 'signup' | 'verified' | 'purchase'
  timestamp: string
  userId?: string
  email: string
  orderId?: string
  totalCents?: number
  currency?: string
  productNames?: string[]
  productSlugs?: string[]
  isGuest?: boolean
}

function formatCHF(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function AdminActivityPage() {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [ordersRes, authUsersRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        `id, total_cents, currency, created_at, user_id, guest_email,
         order_items ( product_variants ( products ( name, slug ) ) )`
      )
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(500),
    // perPage 1000 is the Supabase max; avoids missing users in large stores
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const orders = ordersRes.data ?? []
  const authUsers = authUsersRes.data?.users ?? []

  const userEmailMap = new Map(authUsers.map((u) => [u.id, u.email ?? '']))

  const events: ActivityEvent[] = []

  for (const user of authUsers) {
    if (user.created_at >= thirtyDaysAgo) {
      events.push({
        id: `signup-${user.id}`,
        type: 'signup',
        timestamp: user.created_at,
        userId: user.id,
        email: user.email ?? '',
      })
    }
    if (user.email_confirmed_at && user.email_confirmed_at >= thirtyDaysAgo) {
      events.push({
        id: `verified-${user.id}`,
        type: 'verified',
        timestamp: user.email_confirmed_at,
        userId: user.id,
        email: user.email ?? '',
      })
    }
  }

  for (const order of orders) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (order as any).order_items ?? []
    const productNames: string[] = []
    const productSlugs: string[] = []
    for (const item of items) {
      const name = item?.product_variants?.products?.name
      const slug = item?.product_variants?.products?.slug
      if (name && !productNames.includes(name)) {
        productNames.push(name)
        if (slug) productSlugs.push(slug)
      }
    }

    const email =
      (order as { guest_email?: string | null }).guest_email ||
      userEmailMap.get((order as { user_id?: string | null }).user_id ?? '') ||
      'Unknown'

    events.push({
      id: `purchase-${order.id}`,
      type: 'purchase',
      timestamp: order.created_at,
      userId: (order as { user_id?: string | null }).user_id ?? undefined,
      email,
      orderId: order.id,
      totalCents: order.total_cents,
      currency: order.currency ?? 'CHF',
      productNames,
      productSlugs,
      isGuest: !(order as { user_id?: string | null }).user_id,
    })
  }

  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // Use Switzerland timezone (Europe/Zurich) for "today" — avoids off-by-one
  // errors when the server runs in UTC and midnight falls inside business hours.
  const todayZurich = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
  const isToday = (ts: string) =>
    new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' }) === todayZurich

  const todaySignups = events.filter((e) => e.type === 'signup' && isToday(e.timestamp)).length
  const todayVerifications = events.filter(
    (e) => e.type === 'verified' && isToday(e.timestamp)
  ).length
  const todayPurchases = events.filter((e) => e.type === 'purchase' && isToday(e.timestamp)).length
  const todayRevenueCents = events
    .filter((e) => e.type === 'purchase' && isToday(e.timestamp))
    .reduce((sum, e) => sum + (e.totalCents ?? 0), 0)

  const thirtyDaySignups = events.filter((e) => e.type === 'signup').length
  const thirtyDayVerifications = events.filter((e) => e.type === 'verified').length
  const thirtyDayPurchases = events.filter((e) => e.type === 'purchase').length
  const thirtyDayRevenueCents = events
    .filter((e) => e.type === 'purchase')
    .reduce((sum, e) => sum + (e.totalCents ?? 0), 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Activity</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live feed of account and purchase events · last 30 days
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Stats — today + 30-day context */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Signups Today</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{todaySignups}</p>
          <p className="mt-1 text-xs text-zinc-600">{thirtyDaySignups} in 30 days</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Verifications Today</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{todayVerifications}</p>
          <p className="mt-1 text-xs text-zinc-600">{thirtyDayVerifications} in 30 days</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Purchases Today</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{todayPurchases}</p>
          <p className="mt-1 text-xs text-zinc-600">{thirtyDayPurchases} in 30 days</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Revenue Today</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{formatCHF(todayRevenueCents)}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {formatCHF(thirtyDayRevenueCents)} in 30 days
          </p>
        </div>
      </div>

      <ActivityFeed events={events} />
    </div>
  )
}
