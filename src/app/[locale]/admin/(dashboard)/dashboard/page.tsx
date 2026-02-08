import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { StripeTestButton } from '@/components/admin/StripeTestButton'
import { ArrowRight, Eye } from 'lucide-react'

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
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const [{ count: productsCount }, { count: ordersCount }, { data: recentOrders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase
      .from('orders')
      .select('id, status, total_cents, created_at, guest_email, user_id, shipping_address_id')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Manually fetch related data to avoid foreign key ambiguity
  let enrichedOrders: any[] = []
  if (recentOrders && recentOrders.length > 0) {
    const shippingIds = recentOrders.map(o => o.shipping_address_id).filter(Boolean) as string[]
    const userIds = recentOrders.map(o => o.user_id).filter(Boolean) as string[]

    const [addressesResult, profilesResult] = await Promise.all([
      shippingIds.length > 0 ? supabase.from('addresses').select('id, full_name').in('id', shippingIds) : { data: [] },
      userIds.length > 0 ? supabase.from('user_profiles').select('id, display_name').in('id', userIds) : { data: [] }
    ])

    const addressMap = new Map(addressesResult.data?.map(a => [a.id, a.full_name]) ?? [])
    const profileMap = new Map(profilesResult.data?.map(p => [p.id, p.display_name]) ?? [])

    enrichedOrders = recentOrders.map(order => ({
      ...order,
      shippingName: order.shipping_address_id ? addressMap.get(order.shipping_address_id) : '-',
      userName: order.user_id ? profileMap.get(order.user_id) : (order.guest_email || 'Guest'),
    }))
  }

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_cents')
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  const totalRevenue = (revenueData ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Active products</p>
          <p className="mt-2 text-2xl font-bold text-zinc-50">{productsCount ?? 0}</p>
          <Link href="/admin/products" className="mt-2 block text-sm text-amber-400 hover:text-amber-300">
            Manage →
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Total orders</p>
          <p className="mt-2 text-2xl font-bold text-zinc-50">{ordersCount ?? 0}</p>
          <Link href="/admin/orders" className="mt-2 block text-sm text-amber-400 hover:text-amber-300">
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
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800">
            <StripeTestButton />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-zinc-50">Recent orders</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Recipient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {enrichedOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-zinc-500">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {order.userName}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {order.shippingName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 ring-1 ring-inset ring-emerald-500/20 capitalize">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-300">{formatPrice(order.total_cents)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {formatRelativeTime(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                    >
                      <button className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 h-8 px-3">
                        Check Order
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              {enrichedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
