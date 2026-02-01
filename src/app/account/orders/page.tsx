import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function OrderHistoryPage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    //
  }

  if (!user) redirect('/login?redirectTo=/account/orders')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_cents, currency, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/account"
          className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300"
        >
          ← Back to account
        </Link>
        <h1 className="text-2xl font-bold text-zinc-50">Order history</h1>

        {orders && orders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 transition hover:border-zinc-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-50">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {formatPrice(order.total_cents)} ·{' '}
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                      order.status === 'paid' || order.status === 'processing'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : order.status === 'shipped' || order.status === 'delivered'
                          ? 'bg-blue-900/50 text-blue-400'
                          : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-zinc-500">No orders yet.</p>
        )}
      </div>
    </div>
  )
}
