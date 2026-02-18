import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { StripeTestButton } from '@/components/admin/StripeTestButton'
import { PrintfulTestButton } from '@/components/admin/PrintfulTestButton'
import { StatsCharts } from '@/components/admin/StatsCharts'
import { ArrowRight, Eye, ShieldCheck } from 'lucide-react'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function AdminDashboardPage() {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  // Fetch current admin profile
  const serverSupabase = await createServerClient()
  const {
    data: { user },
  } = await serverSupabase.auth.getUser()
  let adminName = 'Admin'

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (profile?.display_name) {
      adminName = profile.display_name
    } else if (user.email) {
      adminName = user.email.split('@')[0]
    }
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
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase
      .from('orders')
      .select('id, status, total_cents, created_at, guest_email, user_id, shipping_address_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('orders')
      .select('total_cents, created_at')
      .in('status', ['paid', 'processing', 'shipped', 'delivered'])
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
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
  ])

  // Calculate top customers and top items
  const customerRevenueMap = new Map<string, { name: string; revenue: number }>()
  const productQuantityMap = new Map<string, { name: string; quantity: number }>()

  if (allSuccessfulOrders) {
    allSuccessfulOrders.forEach((order: any) => {
      // Top Customers
      const customerId = order.user_id || order.guest_email || 'Unknown'
      const existingCustomer = customerRevenueMap.get(customerId) || {
        name: order.guest_email || 'User',
        revenue: 0,
      }
      customerRevenueMap.set(customerId, {
        name: existingCustomer.name,
        revenue: existingCustomer.revenue + order.total_cents,
      })

      // Top Items
      order.order_items?.forEach((item: any) => {
        const productName = item.product_variants?.products?.name || 'Unknown Product'
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

  // Refine customer names (fetch profiles for user_ids)
  const userIdsToFetch = Array.from(customerRevenueMap.keys()).filter((id) => id.length === 36) // Simple UUID check
  if (userIdsToFetch.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', userIdsToFetch)
    profiles?.forEach((p) => {
      if (customerRevenueMap.has(p.id)) {
        customerRevenueMap.get(p.id)!.name = p.display_name || 'User'
      }
    })
  }

  const topCustomers = Array.from(customerRevenueMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)

  const topProducts = Array.from(productQuantityMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  // Group historical data for charts
  const chartDataMap = new Map<string, { date: string; revenue: number; orders: number }>()

  // Initialize dates
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateKey = d.toISOString().split('T')[0]
    chartDataMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0 })
  }

  // Populate actual data
  if (historicalOrders) {
    historicalOrders.forEach((order: any) => {
      const dateKey = new Date(order.created_at).toISOString().split('T')[0]
      if (chartDataMap.has(dateKey)) {
        const entry = chartDataMap.get(dateKey)!
        entry.revenue += order.total_cents
        entry.orders += 1
      }
    })
  }

  const chartData = Array.from(chartDataMap.values())

  // Manually fetch related data to avoid foreign key ambiguity
  let enrichedOrders: any[] = []
  if (recentOrders && recentOrders.length > 0) {
    const shippingIds = recentOrders
      .map((o: any) => o.shipping_address_id)
      .filter(Boolean) as string[]
    const userIds = recentOrders.map((o: any) => o.user_id).filter(Boolean) as string[]

    const [addressesResult, profilesResult] = await Promise.all([
      shippingIds.length > 0
        ? supabase.from('addresses').select('id, full_name').in('id', shippingIds)
        : { data: [] as any[] },
      userIds.length > 0
        ? supabase.from('user_profiles').select('id, display_name').in('id', userIds)
        : { data: [] as any[] },
    ])

    const addressMap = new Map(addressesResult.data?.map((a: any) => [a.id, a.full_name]) ?? [])
    const profileMap = new Map(profilesResult.data?.map((p: any) => [p.id, p.display_name]) ?? [])

    enrichedOrders = recentOrders.map((order: any) => ({
      ...order,
      shippingName: order.shipping_address_id ? addressMap.get(order.shipping_address_id) : '-',
      userName: order.user_id ? profileMap.get(order.user_id) : order.guest_email || 'Guest',
    }))
  }

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_cents')
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  const totalRevenue = (revenueData ?? []).reduce(
    (s: number, o: any) => s + (o.total_cents ?? 0),
    0
  )

  return (
    <div className="p-8">
      <div className="flex items-baseline gap-4">
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="text-zinc-400">
          Welcome, <span className="text-zinc-50 font-medium">{adminName}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Active products</p>
          <p className="mt-2 text-2xl font-bold text-zinc-50">{productsCount ?? 0}</p>
          <Link
            href="/admin/products"
            className="mt-2 block text-sm text-amber-400 hover:text-amber-300"
          >
            Manage →
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Total orders</p>
          <p className="mt-2 text-2xl font-bold text-zinc-50">{ordersCount ?? 0}</p>
          <Link
            href="/admin/orders"
            className="mt-2 block text-sm text-amber-400 hover:text-amber-300"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Revenue</p>
          <p className="mt-2 text-2xl font-bold text-zinc-50">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="mb-4">
            <p className="text-sm text-zinc-400">Quick actions</p>
            <div className="mt-2 space-y-2">
              <Link
                href="/admin/products/new"
                className="block text-sm text-amber-400 hover:text-amber-300"
              >
                + New product
              </Link>
              <Link
                href="/admin/discounts/new"
                className="block text-sm text-amber-400 hover:text-amber-300"
              >
                + New discount
              </Link>
              <Link
                href="/admin/customers"
                className="block text-sm text-amber-400 hover:text-amber-300"
              >
                → Customers
              </Link>
              <Link
                href="/admin/newsletter"
                className="block text-sm text-amber-400 hover:text-amber-300"
              >
                → Newsletter
              </Link>
              <Link
                href="/admin/stock-notifications"
                className="block text-sm text-amber-400 hover:text-amber-300"
              >
                → Stock notifications
              </Link>
            </div>
          </div>
        </div>
      </div>

      <StatsCharts data={chartData} />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-base font-semibold text-zinc-50">Top 3 Customers</h3>
          <div className="mt-4 space-y-4">
            {topCustomers.map((customer, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-50">{customer.name}</p>
                  <p className="text-xs text-zinc-500">Total spent</p>
                </div>
                <p className="text-sm font-bold text-emerald-400">
                  {formatPrice(customer.revenue)}
                </p>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="text-sm text-zinc-500">No customer data yet</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-base font-semibold text-zinc-50">Top 3 Best Selling Items</h3>
          <div className="mt-4 space-y-4">
            {topProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-50">{product.name}</p>
                  <p className="text-xs text-zinc-500">Units sold</p>
                </div>
                <p className="text-sm font-bold text-amber-500">{product.quantity}</p>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-zinc-500">No sales data yet</p>}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-zinc-50 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          System Testing
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <StripeTestButton />
          <PrintfulTestButton />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-zinc-50">Recent orders</h2>

        {/* Mobile View: Card List */}
        <div className="mt-4 space-y-4 md:hidden">
          {enrichedOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-zinc-500">#{order.id.slice(0, 8)}</span>
                <span className="text-xs text-zinc-500">
                  {formatRelativeTime(order.created_at)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-300">{order.userName}</p>
                  <p className="text-xs text-zinc-500">{order.shippingName}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-bold text-zinc-200">
                    {formatPrice(order.total_cents)}
                  </p>
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 ring-1 ring-inset ring-emerald-500/20 capitalize">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-3">
                <Link href={`/admin/orders/${order.id}`} className="block">
                  <button className="flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 active:scale-[0.98]">
                    Check Order
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
          {enrichedOrders.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
              No orders yet
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
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Recipient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {enrichedOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-zinc-800/20 transition-colors">
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
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500 ring-1 ring-inset ring-emerald-500/20 capitalize">
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-zinc-300">
                      {formatPrice(order.total_cents)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                      {formatRelativeTime(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <button className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 active:scale-[0.98]">
                          Check Order
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {enrichedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
