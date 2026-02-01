import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function AdminOrdersPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8 text-red-400">Admin client not configured</div>

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_cents, guest_email, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-50">Orders</h1>

      <div className="mt-8 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Order</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-b border-zinc-800/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-amber-400 hover:text-amber-300"
                  >
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{order.guest_email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs capitalize ${
                      ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                        ? 'bg-emerald-900/40 text-emerald-400'
                        : order.status === 'cancelled' || order.status === 'refunded'
                          ? 'bg-red-900/40 text-red-400'
                          : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{formatPrice(order.total_cents)}</td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {new Date(order.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(orders ?? []).length === 0 && (
          <p className="p-8 text-center text-zinc-500">No orders yet</p>
        )}
      </div>
    </div>
  )
}
