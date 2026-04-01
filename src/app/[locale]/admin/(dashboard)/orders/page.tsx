import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { getTranslations } from 'next-intl/server'

const VALID_SORT_COLS = ['created_at', 'total_cents', 'status'] as const
type SortCol = (typeof VALID_SORT_COLS)[number]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
    sort?: string
    dir?: string
    from?: string
    to?: string
    archived?: string
  }>
}) {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const {
    page: pageParam,
    limit: limitParam,
    search,
    status,
    sort,
    dir,
    from,
    to,
    archived,
  } = await searchParams

  // When archived=1 we show only archived orders; otherwise only non-archived
  const showArchived = archived === '1'

  const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 10), 100)
  const page = parseInt(pageParam || '1', 10) || 1
  const start = (page - 1) * limit
  const end = start + limit - 1

  const sortCol: SortCol = VALID_SORT_COLS.includes(sort as SortCol)
    ? (sort as SortCol)
    : 'created_at'
  const sortAsc = dir === 'asc'

  const s = search?.trim()

  // ── Resilient is_archived probe (separate query — safe if schema cache stale) ─
  // Same pattern as printful_cost_cents in accounting.ts.
  const archivedSet = new Set<string>()
  let schemaReady = false
  try {
    const { data: archivedRows, error: archivedErr } = await supabase
      .from('orders')
      .select('id, is_archived')
      .eq('is_archived', true)
    if (!archivedErr) {
      schemaReady = true
      for (const r of archivedRows ?? []) archivedSet.add(r.id)
    }
  } catch {
    // Schema cache not refreshed yet — all orders treated as non-archived
  }

  // ── Build queries (typed as any to allow conditional .eq on new column) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('orders')
    .select('id, status, total_cents, guest_email, created_at, discount_cents, order_items(id)', {
      count: 'exact',
    })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agg: any = supabase.from('orders').select('total_cents')

  // Apply archive filter only when the schema cache knows the column
  if (schemaReady) {
    q = q.eq('is_archived', showArchived)
    agg = agg.eq('is_archived', showArchived)
  }

  if (s) {
    const orFilter = `guest_email.ilike.%${s}%,id.ilike.${s}%`
    q = q.or(orFilter)
    agg = agg.or(orFilter)
  }
  if (status && status !== 'all') {
    q = q.eq('status', status)
    agg = agg.eq('status', status)
  }
  if (from) {
    q = q.gte('created_at', from)
    agg = agg.gte('created_at', from)
  }
  if (to) {
    const toEnd = to + 'T23:59:59.999Z'
    q = q.lte('created_at', toEnd)
    agg = agg.lte('created_at', toEnd)
  }

  q = q.order(sortCol, { ascending: sortAsc }).range(start, end)

  const [{ data: rawOrders, count, error }, { data: allForStats }] = await Promise.all([q, agg])

  if (error) console.error('[AdminOrdersPage] Database error:', error)

  // Transform: flatten item_count; derive is_archived from the resilient probe set
  const orders = (rawOrders ?? []).map(
    (o: {
      id: string
      status: string
      total_cents: number
      guest_email: string | null
      created_at: string
      discount_cents?: number | null
      order_items?: unknown[]
    }) => ({
      id: o.id,
      status: o.status,
      total_cents: o.total_cents,
      guest_email: o.guest_email,
      created_at: o.created_at,
      discount_cents: o.discount_cents ?? null,
      is_archived: archivedSet.has(o.id),
      item_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
    })
  )

  const totalRevenue =
    (allForStats as Array<{ total_cents?: number | null }> | null)?.reduce(
      (sum, o) => sum + (o.total_cents ?? 0),
      0
    ) ?? 0
  const avgOrderValue =
    allForStats && allForStats.length > 0 ? Math.round(totalRevenue / allForStats.length) : 0

  const totalPages = count ? Math.ceil(count / limit) : 1
  const t = await getTranslations('admin')

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-8">
      <h1 className="text-2xl font-bold text-zinc-50">{t('orders.title')}</h1>
      <div className="mt-6">
        <OrdersTable
          orders={orders}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count ?? 0}
          limit={limit}
          search={search ?? ''}
          statusFilter={status ?? ''}
          sortBy={sortCol}
          sortDir={sortAsc ? 'asc' : 'desc'}
          from={from ?? ''}
          to={to ?? ''}
          totalRevenue={totalRevenue}
          avgOrderValue={avgOrderValue}
          showArchived={showArchived}
        />
      </div>
    </div>
  )
}
