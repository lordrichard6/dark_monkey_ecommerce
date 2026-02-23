import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { OrdersTable } from '@/components/admin/OrdersTable'

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
  }>
}) {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const { page: pageParam, limit: limitParam, search, status, sort, dir } = await searchParams

  const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 10), 100)
  const page = parseInt(pageParam || '1', 10) || 1
  const start = (page - 1) * limit
  const end = start + limit - 1

  const sortCol: SortCol = VALID_SORT_COLS.includes(sort as SortCol)
    ? (sort as SortCol)
    : 'created_at'
  const sortAsc = dir === 'asc'

  let query = supabase
    .from('orders')
    .select('id, status, total_cents, guest_email, created_at', { count: 'exact' })

  // Filters
  if (search?.trim()) {
    query = query.ilike('guest_email', `%${search.trim()}%`)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Sort
  query = query.order(sortCol, { ascending: sortAsc })

  query = query.range(start, end)

  const { data: orders, count, error } = await query

  if (error) {
    console.error('[AdminOrdersPage] Database error:', error)
  }

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Orders</h1>
      </div>

      <div className="mt-8">
        <OrdersTable
          orders={orders ?? []}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count ?? 0}
          limit={limit}
          search={search ?? ''}
          statusFilter={status ?? ''}
          sortBy={sortCol}
          sortDir={sortAsc ? 'asc' : 'desc'}
        />
      </div>
    </div>
  )
}
