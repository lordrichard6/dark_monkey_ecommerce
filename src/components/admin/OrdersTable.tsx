'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback, useRef, useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  X,
  Download,
  Tag,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import { archiveOrder } from '@/actions/admin-orders'

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  id: string
  status: string
  total_cents: number
  guest_email: string | null
  created_at: string
  discount_cents: number | null
  is_archived: boolean
  item_count: number
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
  from: string
  to: string
  totalRevenue: number
  avgOrderValue: number
  showArchived: boolean
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-zinc-800 text-zinc-400 ring-zinc-700',
  paid: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  processing: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 ring-red-500/20',
  refunded: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-zinc-500',
  paid: 'bg-blue-400',
  processing: 'bg-amber-400',
  shipped: 'bg-purple-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
  refunded: 'bg-rose-400',
}

const ALL_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function exportToCsv(orders: Order[]) {
  const headers = [
    'Order ID',
    'Customer',
    'Status',
    'Items',
    'Total (CHF)',
    'Discount (CHF)',
    'Date',
  ]
  const rows = orders.map((o) => [
    o.id,
    o.guest_email ?? '',
    o.status,
    String(o.item_count),
    (o.total_cents / 100).toFixed(2),
    o.discount_cents ? (o.discount_cents / 100).toFixed(2) : '0.00',
    new Date(o.created_at).toISOString(),
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status, label }: { status: string; label: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-zinc-800 text-zinc-400 ring-zinc-700'
  const dot = STATUS_DOT[status] ?? 'bg-zinc-500'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${cls}`}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-zinc-600" />
  return dir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3 text-amber-400" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3 text-amber-400" />
  )
}

// ─── Archive button ───────────────────────────────────────────────────────────
function ArchiveButton({
  orderId,
  isArchived,
  onDone,
}: {
  orderId: string
  isArchived: boolean
  onDone: (ok: boolean) => void
}) {
  const t = useTranslations('admin')
  const [pending, setPending] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setPending(true)
    const result = await archiveOrder(orderId, !isArchived)
    setPending(false)
    if (!result.ok) {
      alert(t('orders.archiveFailed'))
      onDone(false)
    } else {
      onDone(true)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={isArchived ? t('orders.unarchive') : t('orders.archive')}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
        isArchived
          ? 'border-amber-700/50 bg-amber-950/40 text-amber-500 hover:border-amber-500/60 hover:text-amber-400'
          : 'border-zinc-700 bg-zinc-800/60 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
      }`}
    >
      {isArchived ? (
        <ArchiveRestore className="h-3.5 w-3.5" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

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
  from,
  to,
  totalRevenue,
  avgOrderValue,
  showArchived,
}: Props) {
  const router = useRouter()
  const t = useTranslations('admin')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [isPending, startTransition] = useTransition()
  // Optimistically hide rows that have just been archived/unarchived
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

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
      if (!('page' in updates)) params.set('page', '1')
      startTransition(() => router.push(`?${params.toString()}`))
    },
    [router]
  )

  function handleSort(col: 'created_at' | 'total_cents' | 'status') {
    pushParams({
      sort: col,
      dir: sortBy === col ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc',
    })
  }

  function handleSearch(value: string) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushParams({ search: value }), 380)
  }

  function setQuickDate(preset: 'today' | 'week' | 'month') {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const today = fmt(now)
    if (preset === 'today') {
      pushParams({ from: today, to: today })
    } else if (preset === 'week') {
      const mon = new Date(now)
      mon.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
      pushParams({ from: fmt(mon), to: today })
    } else {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      pushParams({ from: fmt(first), to: today })
    }
  }

  const hasFilters = search || (statusFilter && statusFilter !== 'all') || from || to
  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1
  const pageEnd = Math.min(currentPage * limit, totalCount)

  const thClass =
    'cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors'
  const thStatic =
    'whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500'

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filter bar ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: Search + actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                defaultValue={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('orders.searchByEmail')}
                className={`h-9 w-full rounded-lg border bg-zinc-800/60 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors ${
                  isPending ? 'border-amber-500/40' : 'border-zinc-700 focus:border-amber-500/50'
                }`}
              />
            </div>
            {/* Export */}
            <button
              onClick={() => exportToCsv(orders)}
              title={t('orders.exportCsv')}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('orders.exportCsv')}</span>
            </button>
            {/* Archived toggle */}
            <button
              onClick={() => pushParams({ archived: showArchived ? undefined : '1', page: '1' })}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors ${
                showArchived
                  ? 'border-amber-700/60 bg-amber-950/40 text-amber-400 hover:border-amber-600/60'
                  : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {showArchived ? t('orders.showActive') : t('orders.showArchived')}
              </span>
            </button>
            {/* Per-page */}
            <select
              value={limit}
              onChange={(e) => pushParams({ limit: e.target.value, page: '1' })}
              className="h-9 shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {/* Row 2: Status pills (horizontally scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => pushParams({ status: 'all' })}
              className={`h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-colors ring-1 ring-inset ${
                !statusFilter || statusFilter === 'all'
                  ? 'bg-zinc-700 text-zinc-200 ring-zinc-600'
                  : 'bg-transparent text-zinc-500 ring-zinc-700 hover:text-zinc-300'
              }`}
            >
              {t('orders.allStatuses')}
            </button>
            {ALL_STATUSES.map((s) => {
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => pushParams({ status: active ? 'all' : s })}
                  className={`h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-colors ring-1 ring-inset ${
                    active
                      ? (STATUS_STYLES[s] ?? 'bg-zinc-800 text-zinc-400 ring-zinc-700')
                      : 'bg-transparent text-zinc-500 ring-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {t(`orders.status_${s}` as Parameters<typeof t>[0])}
                </button>
              )
            })}
          </div>

          {/* Row 3: Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-zinc-500">{t('orders.dateFrom')}</span>
              <input
                type="date"
                value={from}
                onChange={(e) => pushParams({ from: e.target.value })}
                className="h-8 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 text-xs text-zinc-300 focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-zinc-500">{t('orders.dateTo')}</span>
              <input
                type="date"
                value={to}
                onChange={(e) => pushParams({ to: e.target.value })}
                className="h-8 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 text-xs text-zinc-300 focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
            {/* Quick presets */}
            <div className="flex items-center gap-1.5">
              {(['today', 'week', 'month'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setQuickDate(preset)}
                  className="h-7 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  {t(
                    `orders.${preset === 'today' ? 'today' : preset === 'week' ? 'thisWeek' : 'thisMonth'}` as Parameters<
                      typeof t
                    >[0]
                  )}
                </button>
              ))}
            </div>
            {/* Clear all */}
            {hasFilters && (
              <button
                onClick={() =>
                  pushParams({ search: '', status: 'all', from: '', to: '', page: '1' })
                }
                className="flex h-7 items-center gap-1 rounded-full border border-red-900/50 bg-red-950/30 px-2.5 text-[11px] text-red-400 transition-colors hover:border-red-700/50 hover:text-red-300"
              >
                <X className="h-3 w-3" />
                {t('orders.clearFilters')}
              </button>
            )}
            {isPending && <span className="text-xs text-zinc-600">…</span>}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {t('orders.ordersCount', { start: pageStart, end: pageEnd, total: totalCount })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
            >
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              {t('orders.revenueTotal')}: {formatPrice(totalRevenue)}
            </span>
            <span
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-700/50 px-3 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-600/50"
            >
              {t('orders.revenueAvg')}: {formatPrice(avgOrderValue)}
            </span>
          </div>
        </div>
      )}

      {/* ── Mobile: Card list ── */}
      <div className="space-y-2 md:hidden">
        {orders
          .filter((o) => !hiddenIds.has(o.id))
          .map((order) => {
            const statusLabel =
              t(`orders.status_${order.status}` as Parameters<typeof t>[0]) ?? order.status
            const hasDiscount = (order.discount_cents ?? 0) > 0
            const isHighValue = order.total_cents >= 10000
            const dotColor = STATUS_DOT[order.status] ?? 'bg-zinc-500'

            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className={`block overflow-hidden rounded-xl border bg-zinc-900/60 transition-colors active:scale-[0.99] ${
                  isHighValue
                    ? 'border-amber-500/30 hover:bg-zinc-800/50'
                    : 'border-zinc-800 hover:bg-zinc-800/40'
                }`}
              >
                {/* Status accent bar */}
                <div
                  className={`h-0.5 w-full ${
                    order.status === 'paid'
                      ? 'bg-blue-500/60'
                      : order.status === 'processing'
                        ? 'bg-amber-500/60'
                        : order.status === 'shipped'
                          ? 'bg-purple-500/60'
                          : order.status === 'delivered'
                            ? 'bg-emerald-500/60'
                            : order.status === 'cancelled'
                              ? 'bg-red-500/60'
                              : order.status === 'refunded'
                                ? 'bg-rose-500/60'
                                : 'bg-zinc-700/60'
                  }`}
                />

                <div className="p-4">
                  {/* Top row: ID + date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Middle row: email + status */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm text-zinc-400">
                      {order.guest_email ?? '—'}
                    </p>
                    <StatusBadge status={order.status} label={statusLabel} />
                  </div>

                  {/* Bottom row: items + discount + total + archive */}
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-700/60 px-1.5 text-[10px] font-semibold text-zinc-400">
                        {order.item_count}
                      </span>
                      <span className="text-xs text-zinc-600">{t('orders.items')}</span>
                      {hasDiscount && (
                        <span title={t('orders.discounted')}>
                          <Tag className="h-3 w-3 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        suppressHydrationWarning
                        className={`text-sm font-bold tabular-nums ${
                          isHighValue ? 'text-amber-300' : 'text-zinc-100'
                        }`}
                      >
                        {formatPrice(order.total_cents)}
                      </span>
                      <ArchiveButton
                        orderId={order.id}
                        isArchived={order.is_archived}
                        onDone={(ok) => {
                          if (ok) setHiddenIds((prev) => new Set([...prev, order.id]))
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        {orders.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-sm text-zinc-500">
            {showArchived
              ? t('orders.noArchivedOrders')
              : hasFilters
                ? t('orders.noOrdersFiltered')
                : t('orders.noOrdersYet')}
          </div>
        )}
      </div>

      {/* ── Desktop: Table ── */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className={thStatic}>{t('orders.order')}</th>
                <th className={thStatic}>{t('orders.customer')}</th>
                <th className={thStatic}>{t('orders.items')}</th>
                <th className={thClass} onClick={() => handleSort('status')}>
                  {t('orders.status')}
                  <SortIcon active={sortBy === 'status'} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => handleSort('total_cents')}>
                  {t('orders.total')}
                  <SortIcon active={sortBy === 'total_cents'} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => handleSort('created_at')}>
                  {t('orders.date')}
                  <SortIcon active={sortBy === 'created_at'} dir={sortDir} />
                </th>
                <th className={thStatic} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {orders
                .filter((o) => !hiddenIds.has(o.id))
                .map((order) => {
                  const isHighValue = order.total_cents >= 10000
                  const hasDiscount = (order.discount_cents ?? 0) > 0
                  const statusLabel =
                    t(`orders.status_${order.status}` as Parameters<typeof t>[0]) ?? order.status
                  const dateObj = new Date(order.created_at)
                  const dateOnly = dateObj.toLocaleDateString('de-CH', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  const dateTimeFull = dateObj.toLocaleString('de-CH')

                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className={`group cursor-pointer transition-colors hover:bg-zinc-800/30 ${
                        isHighValue ? 'border-l-2 border-l-amber-500/40' : ''
                      }`}
                    >
                      {/* Order ID */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono font-bold text-amber-400 transition-colors group-hover:text-amber-300">
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td
                        className="whitespace-nowrap px-4 py-3 text-zinc-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.guest_email ? (
                          <Link
                            href={`/admin/customers?search=${encodeURIComponent(order.guest_email)}`}
                            className="transition-colors hover:text-amber-400"
                          >
                            {order.guest_email}
                          </Link>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-700/60 px-1.5 text-[10px] font-semibold text-zinc-400">
                          {order.item_count}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={order.status} label={statusLabel} />
                      </td>

                      {/* Total */}
                      <td className="whitespace-nowrap px-4 py-3" suppressHydrationWarning>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold tabular-nums ${
                              isHighValue ? 'text-amber-300' : 'text-zinc-200'
                            }`}
                          >
                            {formatPrice(order.total_cents)}
                          </span>
                          {hasDiscount && (
                            <span title={t('orders.discounted')}>
                              <Tag className="h-3 w-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td
                        className="whitespace-nowrap px-4 py-3 text-zinc-500"
                        title={dateTimeFull}
                        suppressHydrationWarning
                      >
                        {dateOnly}
                      </td>

                      {/* Archive */}
                      <td
                        className="whitespace-nowrap px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArchiveButton
                          orderId={order.id}
                          isArchived={order.is_archived}
                          onDone={(ok) => {
                            if (ok) setHiddenIds((prev) => new Set([...prev, order.id]))
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    {showArchived
                      ? t('orders.noArchivedOrders')
                      : hasFilters
                        ? t('orders.noOrdersFiltered')
                        : t('orders.noOrdersYet')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => pushParams({ page: currentPage - 1 })}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            {t('orders.prev')}
          </button>
          <span className="text-xs text-zinc-500">
            {t('orders.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => pushParams({ page: currentPage + 1 })}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            {t('orders.next')}
          </button>
        </div>
      )}
    </div>
  )
}
