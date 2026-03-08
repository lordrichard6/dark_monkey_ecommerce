import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatPrice, SupportedCurrency } from '@/lib/currency'

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  processing: 'bg-amber-500/10  text-amber-400   border border-amber-500/20',
  shipped: 'bg-blue-500/10   text-blue-400    border border-blue-500/20',
  delivered: 'bg-green-500/10  text-green-400   border border-green-500/20',
  cancelled: 'bg-red-500/10    text-red-400     border border-red-500/20',
  refunded: 'bg-purple-500/10 text-purple-400  border border-purple-500/20',
  pending: 'bg-zinc-800      text-zinc-400    border border-zinc-700',
}

export default async function OrderHistoryPage() {
  const t = await getTranslations('account')
  const locale = await getLocale()
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
          {t('backToAccount')}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-50">{t('orderHistory')}</h1>

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
                    <p className="font-medium text-zinc-50">Order #{order.id.slice(0, 8)}</p>
                    <p className="mt-1 text-sm text-zinc-400" suppressHydrationWarning>
                      {formatPrice(order.total_cents, order.currency as SupportedCurrency)} &middot;{' '}
                      {new Date(order.created_at).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      STATUS_COLORS[order.status] ?? STATUS_COLORS['pending']
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-zinc-500">{t('noOrdersYet')}</p>
        )}
      </div>
    </div>
  )
}
