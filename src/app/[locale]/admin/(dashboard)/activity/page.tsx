import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { ActivityFeed } from './activity-feed'

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
  isGuest?: boolean
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
         order_items ( product_variants ( products ( name ) ) )`
      )
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ])

  const orders = ordersRes.data ?? []
  const authUsers = authUsersRes.data?.users ?? []

  // Map userId → email for resolving purchase actors
  const userEmailMap = new Map(authUsers.map((u) => [u.id, u.email ?? '']))

  const events: ActivityEvent[] = []

  // Signup & verification events from auth users
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

  // Purchase events from orders
  for (const order of orders) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (order as any).order_items ?? []
    const productNames: string[] = []
    for (const item of items) {
      const name = item?.product_variants?.products?.name
      if (name && !productNames.includes(name)) productNames.push(name)
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
      isGuest: !(order as { user_id?: string | null }).user_id,
    })
  }

  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // Stats for today
  const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const todaySignups = events.filter((e) => e.type === 'signup' && e.timestamp >= todayIso).length
  const todayVerifications = events.filter(
    (e) => e.type === 'verified' && e.timestamp >= todayIso
  ).length
  const todayPurchases = events.filter(
    (e) => e.type === 'purchase' && e.timestamp >= todayIso
  ).length

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Activity</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Live feed of account and purchase events · last 30 days
        </p>
      </div>

      {/* Today stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Signups Today</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{todaySignups}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Verifications Today</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{todayVerifications}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Purchases Today</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{todayPurchases}</p>
        </div>
      </div>

      <ActivityFeed events={events} />
    </div>
  )
}
