import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { ActivityFeed } from './activity-feed'
import { getTranslations } from 'next-intl/server'
import { Users, UserCheck, ShoppingBag, TrendingUp } from 'lucide-react'

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
  productIds?: string[]
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
  const t = await getTranslations('admin')
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-4 sm:p-8">
        <AdminNotConfigured />
      </div>
    )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [ordersRes, authUsersRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        `id, total_cents, currency, created_at, user_id, guest_email,
         order_items ( product_variants ( products ( id, name, slug ) ) )`
      )
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(500),
    // perPage 1000 is the Supabase auth admin API max
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const orders = ordersRes.data ?? []
  const authUsers = authUsersRes.data?.users ?? []

  // Detect truncation so we can warn the user in the UI
  const isTruncatedOrders = (ordersRes.data?.length ?? 0) >= 500
  const isTruncatedUsers = (authUsersRes.data?.users?.length ?? 0) >= 1000

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
    const productIds: string[] = []

    for (const item of items) {
      const name = item?.product_variants?.products?.name
      const slug = item?.product_variants?.products?.slug
      const id = item?.product_variants?.products?.id
      if (name && !productNames.includes(name)) {
        productNames.push(name)
        if (slug) productSlugs.push(slug)
        if (id) productIds.push(id)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderAny = order as any
    const email = orderAny.guest_email || userEmailMap.get(orderAny.user_id ?? '') || 'Unknown'

    events.push({
      id: `purchase-${order.id}`,
      type: 'purchase',
      timestamp: order.created_at,
      userId: orderAny.user_id ?? undefined,
      email,
      orderId: order.id,
      totalCents: order.total_cents,
      currency: order.currency ?? 'CHF',
      productNames,
      productSlugs,
      productIds,
      isGuest: !orderAny.user_id,
    })
  }

  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // Use Europe/Zurich for "today" to avoid UTC off-by-one at midnight
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
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">{t('activity.title')}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t('activity.subtitle')}</p>
      </div>

      {/* Stats — today + 30-day context */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Signups */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
              <Users className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <p className="text-xs text-zinc-500">{t('activity.signupsToday')}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-50">{todaySignups}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {t('activity.inThirtyDays', { n: thirtyDaySignups })}
          </p>
        </div>

        {/* Verifications */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-500">{t('activity.verificationsToday')}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-50">{todayVerifications}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {t('activity.inThirtyDays', { n: thirtyDayVerifications })}
          </p>
        </div>

        {/* Purchases */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
              <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-zinc-500">{t('activity.purchasesToday')}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-50">{todayPurchases}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {t('activity.inThirtyDays', { n: thirtyDayPurchases })}
          </p>
        </div>

        {/* Revenue */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-zinc-500">{t('activity.revenueToday')}</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{formatCHF(todayRevenueCents)}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {t('activity.inThirtyDays', { n: formatCHF(thirtyDayRevenueCents) })}
          </p>
        </div>
      </div>

      <ActivityFeed
        events={events}
        isTruncatedOrders={isTruncatedOrders}
        isTruncatedUsers={isTruncatedUsers}
      />
    </div>
  )
}
