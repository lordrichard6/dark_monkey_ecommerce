import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { StripeTestButton } from '@/components/admin/StripeTestButton'
import { PrintfulTestButton } from '@/components/admin/PrintfulTestButton'
import { StatsChartsClient } from '@/components/admin/StatsChartsClient'
import { ArrowRight, ShieldCheck } from 'lucide-react'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

// Maps order status to Tailwind badge colour classes
function statusBadgeClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20'
    case 'processing':
      return 'bg-amber-500/10 text-amber-500 ring-amber-500/20'
    case 'shipped':
      return 'bg-blue-500/10 text-blue-500 ring-blue-500/20'
    case 'delivered':
      return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 ring-red-500/20'
    case 'refunded':
      return 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
    default:
      return 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
  }
}

// Proper UUID v4 regex — avoids false-positives from 36-char guest emails
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin')

  // Relative-time formatter — defined here so it closes over `t` for i18n
  function relativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return t('dashboard.justNow')
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return t('dashboard.minutesAgo', { n: diffInMinutes })
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return t('dashboard.hoursAgo', { n: diffInHours })
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return t('dashboard.daysAgo', { n: diffInDays })
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return t('dashboard.weeksAgo', { n: diffInWeeks })
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return t('dashboard.monthsAgo', { n: diffInMonths })
    return date.toLocaleDateString('de-CH', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Translated status label lookup
  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      paid: t('dashboard.statusPaid'),
      processing: t('dashboard.statusProcessing'),
      shipped: t('dashboard.statusShipped'),
      delivered: t('dashboard.statusDelivered'),
      cancelled: t('dashboard.statusCancelled'),
      refunded: t('dashboard.statusRefunded'),
    }
    return labels[status] ?? status
  }

  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-4 sm:p-8">
        <AdminNotConfigured />
      </div>
    )

  // Verify caller is an authenticated admin — defense-in-depth behind middleware
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/login')

  // Fetch current admin display name
  let adminName = 'Admin'
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', adminUser.id)
    .single()

  if (profile?.display_name) {
    adminName = profile.display_name
  } else if (adminUser.email) {
    adminName = adminUser.email.split('@')[0]
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: productsCount },
    { count: ordersCount },
    { data: recentOrders },
    { data: historicalOrders },
    { data: allSuccessfulOrders },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['paid', 'processing', 'shipped', 'delivered'])
      .eq('is_archived', false),
    supabase
      .from('orders')
      .select('id, status, total_cents, created_at, guest_email, user_id, shipping_address_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('orders')
      .select('total_cents, created_at')
      .in('status', ['paid', 'processing', 'shipped', 'delivered'])
      .eq('is_archived', false)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        guest_email,
        total_cents,
        order_items (
          quantity,
          variant_id,
          product_variants (
            products (
              name
            )
          )
        )
      `
      )
      .in('status', ['paid', 'processing', 'shipped', 'delivered'])
      .eq('is_archived', false),
  ])

  // Compute all-time revenue directly from the data we already have — no extra DB round-trip
  const totalRevenue = (allSuccessfulOrders ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0)

  // Calculate top customers and top items
  const customerRevenueMap = new Map<string, { name: string; revenue: number }>()
  const productQuantityMap = new Map<string, { name: string; quantity: number }>()

  if (allSuccessfulOrders) {
    allSuccessfulOrders.forEach((order) => {
      // Top Customers
      const customerId = order.user_id || order.guest_email || 'Unknown'
      const existingCustomer = customerRevenueMap.get(customerId) || {
        // For guests: use email. For registered users: short ID placeholder until we refine below.
        name: order.guest_email || `#${(order.user_id ?? 'Unknown').slice(0, 8)}`,
        revenue: 0,
      }
      customerRevenueMap.set(customerId, {
        name: existingCustomer.name,
        revenue: existingCustomer.revenue + order.total_cents,
      })

      // Top Items
      order.order_items?.forEach((item) => {
        const productVariants = item.product_variants as unknown as {
          products: { name: string } | null
        } | null
        const productName = productVariants?.products?.name || 'Unknown Product'
        const existingProduct = productQuantityMap.get(productName) || {
          name: productName,
          quantity: 0,
        }
        productQuantityMap.set(productName, {
          name: productName,
          quantity: existingProduct.quantity + (item.quantity || 0),
        })
      })
    })
  }

  // Refine customer names with display_name from user_profiles
  const userIdsToFetch = Array.from(customerRevenueMap.keys()).filter((id) => UUID_REGEX.test(id))
  if (userIdsToFetch.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', userIdsToFetch)
    profiles?.forEach((p) => {
      if (customerRevenueMap.has(p.id) && p.display_name) {
        customerRevenueMap.get(p.id)!.name = p.display_name
      }
    })
  }

  const topCustomers = Array.from(customerRevenueMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)

  const topProducts = Array.from(productQuantityMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  // Group historical data for charts using Europe/Zurich timezone to avoid UTC off-by-one
  const chartDataMap = new Map<string, { date: string; revenue: number; orders: number }>()

  // Initialize all 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateKey = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
    chartDataMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0 })
  }

  // Populate actual data — bucket by Zurich date, not UTC date
  if (historicalOrders) {
    historicalOrders.forEach((order) => {
      const dateKey = new Date(order.created_at).toLocaleDateString('en-CA', {
        timeZone: 'Europe/Zurich',
      })
      if (chartDataMap.has(dateKey)) {
        const entry = chartDataMap.get(dateKey)!
        entry.revenue += order.total_cents
        entry.orders += 1
      }
    })
  }

  const chartData = Array.from(chartDataMap.values())

  // Fetch shipping addresses and user profiles for recent orders separately
  // (avoids Supabase foreign key ambiguity on orders → addresses)
  type EnrichedOrder = {
    id: string
    status: string
    total_cents: number
    created_at: string
    guest_email: string | null
    user_id: string | null
    shipping_address_id: string | null
    shippingName: string
    userName: string
  }
  let enrichedOrders: EnrichedOrder[] = []
  if (recentOrders && recentOrders.length > 0) {
    const shippingIds = recentOrders.map((o) => o.shipping_address_id).filter(Boolean) as string[]
    const userIds = recentOrders.map((o) => o.user_id).filter(Boolean) as string[]

    const [addressesResult, profilesResult] = await Promise.all([
      shippingIds.length > 0
        ? supabase.from('addresses').select('id, full_name').in('id', shippingIds)
        : { data: [] as { id: string; full_name: string | null }[] },
      userIds.length > 0
        ? supabase.from('user_profiles').select('id, display_name').in('id', userIds)
        : { data: [] as { id: string; display_name: string | null }[] },
    ])

    const addressMap = new Map(addressesResult.data?.map((a) => [a.id, a.full_name]) ?? [])
    const profileMap = new Map(profilesResult.data?.map((p) => [p.id, p.display_name]) ?? [])

    enrichedOrders = recentOrders.map((order) => ({
      ...order,
      // Fallback to em-dash if address was deleted or order has no shipping address
      shippingName: order.shipping_address_id
        ? (addressMap.get(order.shipping_address_id) ?? '—')
        : '—',
      // Fallback to short user ID if profile missing; guest orders use email
      userName: order.user_id
        ? (profileMap.get(order.user_id) ?? `#${order.user_id.slice(0, 8)}`)
        : (order.guest_email ?? 'Guest'),
    }))
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-baseline gap-2 sm:gap-4">
        <h1 className="text-2xl font-bold text-zinc-50">{t('dashboard.title')}</h1>
        <p className="text-zinc-400">
          {t('dashboard.welcome')} <span className="font-medium text-zinc-50">{adminName}</span>
        </p>
      </div>

      {/* Stats grid — 2×2 on mobile, 2-col on sm, 4-col on lg */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
        {/* Active Products */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
          <p className="text-[11px] leading-tight text-zinc-400 sm:text-sm">
            {t('dashboard.activeProducts')}
          </p>
          <p className="mt-1.5 text-xl font-bold text-zinc-50 sm:mt-2 sm:text-2xl">
            {productsCount ?? 0}
          </p>
          <Link
            href="/admin/products"
            className="mt-1.5 block text-xs text-amber-400 hover:text-amber-300 sm:mt-2 sm:text-sm"
          >
            {t('dashboard.manage')}
          </Link>
        </div>

        {/* Total Orders */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
          <p className="text-[11px] leading-tight text-zinc-400 sm:text-sm">
            {t('dashboard.totalOrders')}
          </p>
          <p className="mt-1.5 text-xl font-bold text-zinc-50 sm:mt-2 sm:text-2xl">
            {ordersCount ?? 0}
          </p>
          <Link
            href="/admin/orders"
            className="mt-1.5 block text-xs text-amber-400 hover:text-amber-300 sm:mt-2 sm:text-sm"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>

        {/* Revenue — all-time, no extra DB query */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
          <p className="text-[11px] leading-tight text-zinc-400 sm:text-sm">
            {t('dashboard.revenue')}
          </p>
          <p className="mt-1.5 break-all text-xl font-bold text-zinc-50 sm:mt-2 sm:text-2xl">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
            {t('dashboard.revenueAllTime')}
          </p>
        </div>

        {/* Quick Actions — full-width row on mobile, quarter-width on lg */}
        <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 lg:col-span-1">
          <p className="text-[11px] leading-tight text-zinc-400 sm:text-sm">
            {t('dashboard.quickActions')}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col sm:gap-x-0 sm:gap-y-0 sm:space-y-2">
            <Link
              href="/admin/products/new"
              className="text-xs text-amber-400 hover:text-amber-300 sm:text-sm"
            >
              {t('dashboard.newProduct')}
            </Link>
            <Link
              href="/admin/discounts/new"
              className="text-xs text-amber-400 hover:text-amber-300 sm:text-sm"
            >
              {t('dashboard.newDiscount')}
            </Link>
            <Link
              href="/admin/customers"
              className="text-xs text-amber-400 hover:text-amber-300 sm:text-sm"
            >
              {t('dashboard.customers')}
            </Link>
            <Link
              href="/admin/newsletter"
              className="text-xs text-amber-400 hover:text-amber-300 sm:text-sm"
            >
              {t('dashboard.newsletter')}
            </Link>
            <Link
              href="/admin/stock-notifications"
              className="text-xs text-amber-400 hover:text-amber-300 sm:text-sm"
            >
              {t('dashboard.stockNotifications')}
            </Link>
          </div>
        </div>
      </div>

      {/* Charts — titles passed as props so they go through i18n */}
      <StatsChartsClient
        data={chartData}
        revenueTitle={t('dashboard.revenueChartTitle')}
        ordersTitle={t('dashboard.ordersChartTitle')}
      />

      {/* Top Customers + Best Selling */}
      <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-50 sm:text-base">
            {t('dashboard.top3Customers')}
          </h3>
          <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
            {topCustomers.map((customer, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0 sm:pb-4"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-medium text-zinc-50">{customer.name}</p>
                  <p className="text-xs text-zinc-500">{t('dashboard.totalSpent')}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-emerald-400">
                  {formatPrice(customer.revenue)}
                </p>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="text-sm text-zinc-500">{t('dashboard.noCustomerData')}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-50 sm:text-base">
            {t('dashboard.top3BestSelling')}
          </h3>
          <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
            {topProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0 sm:pb-4"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-medium text-zinc-50">{product.name}</p>
                  <p className="text-xs text-zinc-500">{t('dashboard.unitsSold')}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-amber-500">{product.quantity}</p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-zinc-500">{t('dashboard.noSalesData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* System Testing */}
      <div className="mt-8 sm:mt-12">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-50 sm:text-lg">
          <ShieldCheck className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
          {t('dashboard.systemTesting')}
        </h2>
        <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-6">
          <StripeTestButton />
          <PrintfulTestButton />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-lg font-semibold text-zinc-50">{t('dashboard.recentOrders')}</h2>

        {/* Mobile View: Card List */}
        <div className="mt-4 space-y-4 md:hidden">
          {enrichedOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-zinc-500">#{order.id.slice(0, 8)}</span>
                <span className="text-xs text-zinc-500">{relativeTime(order.created_at)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-300">{order.userName}</p>
                  <p className="text-xs text-zinc-500">{order.shippingName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-bold text-zinc-200">
                    {formatPrice(order.total_cents)}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusBadgeClass(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 active:scale-[0.98]"
                >
                  {t('dashboard.checkOrder')}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {enrichedOrders.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
              {t('dashboard.noOrdersYet')}
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="mt-4 hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.order')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.recipient')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.total')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.date')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {t('dashboard.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {enrichedOrders.map((order) => (
                  <tr key={order.id} className="group transition-colors hover:bg-zinc-800/20">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm text-zinc-500">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                      {order.userName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                      {order.shippingName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-zinc-300">
                      {formatPrice(order.total_cents)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                      {relativeTime(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 active:scale-[0.98]"
                      >
                        {t('dashboard.checkOrder')}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {enrichedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500">
                      {t('dashboard.noOrdersYet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View all orders link */}
        <div className="mt-4 flex justify-end">
          <Link href="/admin/orders" className="text-sm text-amber-400 hover:text-amber-300">
            {t('dashboard.viewAllOrders')}
          </Link>
        </div>
      </div>
    </div>
  )
}
