import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function AdminDashboardPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const [{ count: productsCount }, { count: ordersCount }, { data: recentOrders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase
      .from('orders')
      .select('id, status, total_cents, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

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
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-zinc-50">Recent orders</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders ?? []).map((order) => (
                <tr key={order.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-300">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{formatPrice(order.total_cents)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(recentOrders ?? []).length === 0 && (
            <p className="p-8 text-center text-zinc-500">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
