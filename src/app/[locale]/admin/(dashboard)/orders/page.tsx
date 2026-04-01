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
  } = await searchParams

  const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 10), 100)
  const page = parseInt(pageParam || '1', 10) || 1
  const start = (page - 1) * limit
  const end = start + limit - 1

  const sortCol: SortCol = VALID_SORT_COLS.includes(sort as SortCol)
    ? (sort as SortCol)
    : 'created_at'
  const sortAsc = dir === 'asc'

  const s = search?.trim()

  // ── Main paginated query ──────────────────────────────────────────────────
  let query = supabase
    .from('orders')
    .select('id, status, total_cents, guest_email, created_at, discount_cents, order_items(id)', {
      count: 'exact',
    })

  // ── Aggregate query (same filters, no pagination) for revenue stats ───────
  let aggQuery = supabase.from('orders').select('total_cents')

  // Filters — applied identically to both queries
  if (s) {
    const orFilter = `guest_email.ilike.%${s}%,id.ilike.${s}%`
    query = query.or(orFilter)
    aggQuery = aggQuery.or(orFilter)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status)
    aggQuery = aggQuery.eq('status', status)
  }
  if (from) {
    query = query.gte('created_at', from)
    aggQuery = aggQuery.gte('created_at', from)
  }
  if (to) {
    const toEnd = to + 'T23:59:59.999Z'
    query = query.lte('created_at', toEnd)
    aggQuery = aggQuery.lte('created_at', toEnd)
  }

  query = query.order(sortCol, { ascending: sortAsc }).range(start, end)

  const [{ data: rawOrders, count, error }, { data: allForStats }] = await Promise.all([
    query,
    aggQuery,
  ])

  if (error) console.error('[AdminOrdersPage] Database error:', error)

  // Transform: flatten item_count from joined order_items array
  const orders = (rawOrders ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    total_cents: o.total_cents,
    guest_email: o.guest_email,
    created_at: o.created_at,
    discount_cents: (o as { discount_cents?: number | null }).discount_cents ?? null,
    item_count: Array.isArray((o as { order_items?: unknown[] }).order_items)
      ? (o as { order_items: unknown[] }).order_items.length
      : 0,
  }))

  const totalRevenue = allForStats?.reduce((sum, o) => sum + (o.total_cents ?? 0), 0) ?? 0
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
        />
      </div>
    </div>
  )
}
