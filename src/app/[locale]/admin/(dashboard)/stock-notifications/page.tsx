import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { NotifyRestockButton } from '@/components/admin/NotifyRestockButton'
import { Bell } from 'lucide-react'

export default async function AdminStockNotificationsPage() {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  // Fetch pending notifications
  const { data: pending } = await supabase
    .from('stock_notifications')
    .select('id, product_id, variant_id, email, product_name, variant_name, created_at')
    .eq('notified', false)
    .order('created_at', { ascending: true })

  // Fetch recently notified (last 30)
  const { data: notified } = await supabase
    .from('stock_notifications')
    .select('id, email, product_name, variant_name, notified_at')
    .eq('notified', true)
    .order('notified_at', { ascending: false })
    .limit(30)

  const pendingRows = pending ?? []
  const notifiedRows = notified ?? []

  // Group pending by variant_id
  type PendingRow = (typeof pendingRows)[number]
  const grouped = new Map<
    string,
    {
      variantId: string
      productId: string
      productName: string
      variantName: string | null
      productSlug: string
      count: number
      firstAt: string
      rows: PendingRow[]
    }
  >()

  // We need product slugs — fetch all distinct product_ids
  const productIds = [...new Set(pendingRows.map((r) => r.product_id))]
  const { data: products } = productIds.length
    ? await supabase.from('products').select('id, slug').in('id', productIds)
    : { data: [] }
  const slugMap = new Map((products ?? []).map((p) => [p.id, p.slug as string]))

  for (const row of pendingRows) {
    const existing = grouped.get(row.variant_id)
    if (existing) {
      existing.count++
      existing.rows.push(row)
    } else {
      grouped.set(row.variant_id, {
        variantId: row.variant_id,
        productId: row.product_id,
        productName: row.product_name,
        variantName: row.variant_name,
        productSlug: slugMap.get(row.product_id) ?? '',
        count: 1,
        firstAt: row.created_at,
        rows: [row],
      })
    }
  }

  const groupedList = [...grouped.values()].sort((a, b) => b.count - a.count)
  const totalWaiting = pendingRows.length
  const variantCount = grouped.size

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-zinc-400" />
        <h1 className="text-2xl font-bold text-zinc-50">Stock Notifications</h1>
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-400">
          <span className="text-2xl font-bold text-zinc-50">{totalWaiting}</span> customer
          {totalWaiting !== 1 ? 's' : ''} waiting across{' '}
          <span className="font-semibold text-zinc-50">{variantCount}</span> variant
          {variantCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Pending section */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">Pending Notifications</h2>

        {groupedList.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 py-12 text-center text-zinc-500">
            No pending notifications 🎉
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Waiting
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    First Request
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {groupedList.map((g) => (
                  <tr key={g.variantId} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-100">{g.productName}</td>
                    <td className="px-4 py-3 text-zinc-400">{g.variantName ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                        {g.count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(g.firstAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <NotifyRestockButton
                        variantId={g.variantId}
                        productName={g.productName}
                        productSlug={g.productSlug}
                        count={g.count}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Already notified section */}
      {notifiedRows.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">Recently Notified</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Notified
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {notifiedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{r.email}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.product_name}</td>
                    <td className="px-4 py-3 text-zinc-500">{r.variant_name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {r.notified_at
                        ? new Date(r.notified_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
