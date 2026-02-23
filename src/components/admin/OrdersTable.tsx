'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  id: string
  status: string
  total_cents: number
  guest_email: string | null
  created_at: string
}

type Props = {
  orders: Order[]
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  search: string
  statusFilter: string
  sortBy: 'created_at' | 'total_cents' | 'status'
  sortDir: 'asc' | 'desc'
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-zinc-800 text-zinc-400 ring-zinc-700',
  paid: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  processing: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 ring-red-500/20',
  refunded: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-zinc-800 text-zinc-400 ring-zinc-700'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  )
}

// ─── Price formatter ──────────────────────────────────────────────────────────
function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 text-zinc-700">↕</span>
  return <span className="ml-1 text-amber-400">{dir === 'asc' ? '↑' : '↓'}</span>
}

const ALL_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

// ─── Main component ───────────────────────────────────────────────────────────
export function OrdersTable({
  orders,
  currentPage,
  totalPages,
  totalCount,
  limit,
  search,
  statusFilter,
  sortBy,
  sortDir,
}: Props) {
  const router = useRouter()

  const pushParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(window.location.search)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }
      // Always reset to page 1 when filters/sort change (except when changing page)
      if (!('page' in updates)) params.set('page', '1')
      router.push(`?${params.toString()}`)
    },
    [router]
  )

  function handleSort(col: 'created_at' | 'total_cents' | 'status') {
    if (sortBy === col) {
      pushParams({ sort: col, dir: sortDir === 'asc' ? 'desc' : 'asc' })
    } else {
      pushParams({ sort: col, dir: 'desc' })
    }
  }

  const hasFilters = search || (statusFilter && statusFilter !== 'all')
  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1
  const pageEnd = Math.min(currentPage * limit, totalCount)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const val = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value
              pushParams({ search: val })
            }}
            className="flex items-center gap-2"
          >
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by email…"
              className="w-56 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
            >
              Search
            </button>
          </form>

          {/* Status filter */}
          <select
            value={statusFilter || 'all'}
            onChange={(e) => pushParams({ status: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300 focus:border-amber-500/60 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => pushParams({ search: '', status: 'all', page: '1' })}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Count + per-page */}
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {pageStart}–{pageEnd} of {totalCount} orders
          </span>
          <select
            value={limit}
            onChange={(e) => pushParams({ limit: e.target.value, page: '1' })}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
          >
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* ── Mobile: Card list ── */}
      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/40 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-amber-400">
                #{order.id.slice(0, 8)}
              </span>
              <span className="text-[10px] text-zinc-500">
                {new Date(order.created_at).toLocaleDateString('de-CH')}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="max-w-[160px] truncate text-sm text-zinc-300">
                {order.guest_email ?? '—'}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-2 text-right text-sm font-bold text-zinc-200">
              {formatPrice(order.total_cents)}
            </div>
          </Link>
        ))}
        {orders.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
            {hasFilters ? 'No orders match your filters.' : 'No orders yet.'}
          </div>
        )}
      </div>

      {/* ── Desktop: Table ── */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Customer
                </th>
                {/* Sortable: Status */}
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <SortIcon active={sortBy === 'status'} dir={sortDir} />
                </th>
                {/* Sortable: Total */}
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  onClick={() => handleSort('total_cents')}
                >
                  Total
                  <SortIcon active={sortBy === 'total_cents'} dir={sortDir} />
                </th>
                {/* Sortable: Date */}
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  onClick={() => handleSort('created_at')}
                >
                  Date
                  <SortIcon active={sortBy === 'created_at'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-zinc-800/30"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-mono text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {order.guest_email ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-zinc-300">
                    {formatPrice(order.total_cents)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleString('de-CH')}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                    {hasFilters ? 'No orders match your filters.' : 'No orders yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => pushParams({ page: currentPage - 1 })}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => pushParams({ page: currentPage + 1 })}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
