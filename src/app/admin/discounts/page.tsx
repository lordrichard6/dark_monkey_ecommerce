import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function AdminDiscountsPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8 text-red-400">Admin client not configured</div>

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

      <div className="mt-8 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Value</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Min order</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Uses</th>
            </tr>
          </thead>
          <tbody>
            {(discounts ?? []).map((d) => (
              <tr key={d.id} className="border-b border-zinc-800/50">
                <td className="px-4 py-3 font-mono font-medium text-zinc-50">{d.code}</td>
                <td className="px-4 py-3 text-sm text-zinc-400 capitalize">{d.type}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">
                  {d.type === 'percentage' ? `${d.value_cents / 100}%` : formatPrice(d.value_cents)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">
                  {d.min_order_cents > 0 ? formatPrice(d.min_order_cents) : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">
                  {d.use_count}
                  {d.max_uses != null ? ` / ${d.max_uses}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(discounts ?? []).length === 0 && (
          <p className="p-8 text-center text-zinc-500">No discounts yet</p>
        )}
      </div>
    </div>
  )
}
