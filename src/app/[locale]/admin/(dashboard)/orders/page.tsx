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

export default async function AdminOrdersPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_cents, guest_email, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-50">Orders</h1>

      {/* Mobile View: Card List */}
      <div className="mt-8 space-y-4 md:hidden">
        {(orders ?? []).map((order) => (
          <div key={order.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/30">
            <div className="flex items-center justify-between">
              <Link
                href={`/admin/orders/${order.id}`}
                className="font-mono text-sm font-bold text-amber-400"
              >
                #{order.id.slice(0, 8)}
              </Link>
              <span className="text-[10px] font-medium text-zinc-500">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</p>
                <p className="text-sm text-zinc-300 truncate max-w-[150px]">{order.guest_email ?? '—'}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-bold text-zinc-200">{formatPrice(order.total_cents)}</p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                      ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                      : order.status === 'cancelled' || order.status === 'refunded'
                        ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                        : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
                    }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-3">
              <Link href={`/admin/orders/${order.id}`} className="block">
                <button className="flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 active:scale-[0.98]">
                  Check Order Detail
                </button>
              </Link>
            </div>
          </div>
        ))}
        {(orders ?? []).length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
            No orders yet
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="mt-8 hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Order</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {order.guest_email ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                          : order.status === 'cancelled' || order.status === 'refunded'
                            ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                            : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
                        }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-zinc-300">
                    {formatPrice(order.total_cents)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
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
