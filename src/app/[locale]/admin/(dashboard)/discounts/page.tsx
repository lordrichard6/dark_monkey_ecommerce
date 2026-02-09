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

export default async function AdminDiscountsPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const { data: discounts } = await supabase
    .from('discounts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Discounts</h1>
        <Link
          href="/admin/discounts/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
        >
          + New discount
        </Link>
      </div>

      {/* Mobile View: Card List */}
      <div className="mt-8 space-y-4 md:hidden">
        {(discounts ?? []).map((d) => (
          <div key={d.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-zinc-50">{d.code}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{d.type}</span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Discount Value</p>
                <p className="text-sm font-bold text-amber-400">
                  {d.type === 'percentage' ? `${d.value_cents / 100}%` : formatPrice(d.value_cents)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Uses</p>
                <p className="text-sm text-zinc-300">
                  {d.use_count}{d.max_uses != null ? ` / ${d.max_uses}` : ''}
                </p>
              </div>
            </div>

            {d.min_order_cents > 0 && (
              <div className="mt-3 border-t border-zinc-800/50 pt-3 flex justify-between items-center">
                <span className="text-xs text-zinc-500">Min. Order</span>
                <span className="text-xs font-medium text-zinc-400">{formatPrice(d.min_order_cents)}</span>
              </div>
            )}
          </div>
        ))}
        {(discounts ?? []).length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
            No discounts yet
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="mt-8 hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Code</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Value</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Min order</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Uses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(discounts ?? []).map((d) => (
                <tr key={d.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-zinc-50">{d.code}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400 capitalize">{d.type}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-amber-500">
                    {d.type === 'percentage' ? `${d.value_cents / 100}%` : formatPrice(d.value_cents)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                    {d.min_order_cents > 0 ? formatPrice(d.min_order_cents) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                    {d.use_count}
                    {d.max_uses != null ? ` / ${d.max_uses}` : ''}
                  </td>
                </tr>
              ))}
              {(discounts ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                    No discounts yet
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
