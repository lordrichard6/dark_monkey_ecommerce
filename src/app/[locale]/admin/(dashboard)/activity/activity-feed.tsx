'use client'

import { useState, useEffect, useTransition, Fragment } from 'react'
import Link from 'next/link'
import { Search, X, RefreshCw, Download, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ActivityEvent } from './page'

const PAGE_SIZE = 50

const FILTER_KEYS = ['all', 'signups', 'verifications', 'purchases'] as const
type Filter = (typeof FILTER_KEYS)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return (
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/Zurich',
    }) +
    ' · ' +
    date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Zurich',
    })
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatTimestamp(iso)
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/** Returns 'yyyy-mm-dd' in Zurich timezone — used as the grouping key */
function getDateGroupKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
}

/** Human-readable label for a date group key */
function getDateGroupLabel(
  key: string,
  todayStr: string,
  yesterdayStr: string,
  todayLabel: string,
  yesterdayLabel: string
): string {
  if (key === todayStr) return todayLabel
  if (key === yesterdayStr) return yesterdayLabel
  // Use noon UTC to prevent timezone edge-cases when parsing 'yyyy-mm-dd'
  const d = new Date(key + 'T12:00:00Z')
  if (d.getUTCFullYear() === new Date().getUTCFullYear()) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── EventIcon ────────────────────────────────────────────────────────────────

function EventIcon({ type }: { type: ActivityEvent['type'] }) {
  if (type === 'signup') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      </div>
    )
  }
  if (type === 'verified') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    </div>
  )
}

// ─── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: ActivityEvent }) {
  const t = useTranslations('admin')

  return (
    <div className="flex items-start gap-3 border-b border-zinc-800/40 py-3.5 last:border-b-0">
      <EventIcon type={event.type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
          {/* Email / customer link */}
          {event.userId ? (
            <Link
              href={`/admin/customers/${event.userId}`}
              className="font-medium text-zinc-200 transition-colors hover:text-amber-400"
            >
              {event.email}
            </Link>
          ) : (
            <span className="font-medium text-zinc-400">{event.email}</span>
          )}

          {/* Signup */}
          {event.type === 'signup' && (
            <span className="text-zinc-500">{t('activity.createdAccount')}</span>
          )}

          {/* Verified */}
          {event.type === 'verified' && (
            <span className="text-zinc-500">{t('activity.verifiedEmail')}</span>
          )}

          {/* Purchase */}
          {event.type === 'purchase' && (
            <>
              <span className="text-zinc-500">{t('activity.purchased')}</span>

              {event.productNames && event.productNames.length > 0 && (
                <span className="text-zinc-200">
                  {event.productNames.slice(0, 2).map((name, i) => {
                    // FIX: use productIds (not slugs) — admin detail page uses [id] not [slug]
                    const productId = event.productIds?.[i]
                    return (
                      <span key={i}>
                        {i > 0 && ', '}
                        {productId ? (
                          <Link
                            href={`/admin/products/${productId}`}
                            className="transition-colors hover:text-amber-400"
                          >
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </span>
                    )
                  })}
                  {event.productNames.length > 2 && (
                    <span className="text-zinc-500">
                      {' '}
                      {t('activity.moreProducts', { count: event.productNames.length - 2 })}
                    </span>
                  )}
                </span>
              )}

              <span className="text-zinc-500">{t('activity.for')}</span>
              <span className="font-semibold text-amber-400">
                {formatPrice(event.totalCents ?? 0, event.currency ?? 'CHF')}
              </span>

              {event.isGuest && (
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  {t('activity.guest')}
                </span>
              )}
            </>
          )}
        </div>

        {/* Timestamp + order link */}
        <div className="mt-0.5 flex items-center gap-2">
          <p
            className="cursor-default text-xs text-zinc-600"
            title={formatTimestamp(event.timestamp)}
            suppressHydrationWarning
          >
            {formatRelativeTime(event.timestamp)}
          </p>
          {event.type === 'purchase' && event.orderId && (
            <Link
              href={`/admin/orders/${event.orderId}`}
              className="font-mono text-xs text-zinc-700 transition-colors hover:text-amber-500"
            >
              #{event.orderId.slice(0, 8)}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

type Props = {
  events: ActivityEvent[]
  isTruncatedOrders: boolean
  isTruncatedUsers: boolean
}

export function ActivityFeed({ events, isTruncatedOrders, isTruncatedUsers }: Props) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  // Incrementing this state triggers re-render to refresh relative timestamps
  const [, setTick] = useState(0)

  // Auto-update relative timestamps every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Reset pagination whenever the filter or search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, search])

  function handleRefresh() {
    startTransition(() => router.refresh())
  }

  function handleExportCsv() {
    const rows = [
      ['Type', 'Email', 'Timestamp', 'Order ID', 'Total (CHF)', 'Products'],
      ...filtered.map((e) => [
        e.type,
        e.email,
        e.timestamp,
        e.orderId ?? '',
        e.totalCents != null ? (e.totalCents / 100).toFixed(2) : '',
        (e.productNames ?? []).join('; '),
      ]),
    ]
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Counts (based on full events list, not filtered) ──────────────────────
  const counts: Record<Filter, number> = {
    all: events.length,
    signups: events.filter((e) => e.type === 'signup').length,
    verifications: events.filter((e) => e.type === 'verified').length,
    purchases: events.filter((e) => e.type === 'purchase').length,
  }

  // ── Filter + search ───────────────────────────────────────────────────────
  const filtered = events.filter((e) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'signups' && e.type === 'signup') ||
      (filter === 'verifications' && e.type === 'verified') ||
      (filter === 'purchases' && e.type === 'purchase')

    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      e.email.toLowerCase().includes(q) ||
      // also match first 8 chars of order ID
      (e.orderId?.slice(0, 8).toLowerCase().includes(q) ?? false)

    return matchesFilter && matchesSearch
  })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount
  const remaining = filtered.length - visibleCount

  // ── Date group helpers ────────────────────────────────────────────────────
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
  const yesterdayStr = new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'Europe/Zurich',
  })

  const filterLabels: Record<Filter, string> = {
    all: t('activity.filterAll'),
    signups: t('activity.filterSignups'),
    verifications: t('activity.filterVerifications'),
    purchases: t('activity.filterPurchases'),
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 p-3 sm:p-4">
        {/* Row 1: Filter tabs — horizontally scrollable to prevent overflow on phones */}
        <div className="mb-3 flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {FILTER_KEYS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
              }`}
            >
              {filterLabels[f]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  filter === f ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800/50 text-zinc-600'
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Row 2: Search + Export + Refresh */}
        <div className="flex items-center gap-2">
          {/* Search (now also matches order IDs) */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder={t('activity.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-8 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            title={t('activity.exportCsv')}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('activity.exportCsv')}</span>
          </button>

          {/* Refresh — spins button AND dims the list below */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title={t('activity.refresh')}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('activity.refresh')}</span>
          </button>
        </div>
      </div>

      {/* ── Truncation warnings ──────────────────────────────────────────── */}
      {(isTruncatedOrders || isTruncatedUsers) && (
        <div className="space-y-1 border-b border-zinc-800 bg-amber-500/5 px-4 py-2.5">
          {isTruncatedOrders && (
            <div className="flex items-center gap-2 text-xs text-amber-500/90">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t('activity.truncatedOrdersWarning')}
            </div>
          )}
          {isTruncatedUsers && (
            <div className="flex items-center gap-2 text-xs text-amber-500/90">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t('activity.truncatedUsersWarning')}
            </div>
          )}
        </div>
      )}

      {/* ── Event list — dims while refreshing ───────────────────────────── */}
      <div
        className={`transition-opacity duration-200 ${isPending ? 'pointer-events-none opacity-40' : ''}`}
      >
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {search ? t('activity.noEventsMatching', { query: search }) : t('activity.noEvents')}
          </p>
        ) : (
          <div className="px-4">
            {/* Date-grouped events */}
            {(() => {
              let lastKey = ''
              return visible.flatMap((event) => {
                const key = getDateGroupKey(event.timestamp)
                const isNewGroup = key !== lastKey
                lastKey = key
                const items: React.ReactNode[] = []

                if (isNewGroup) {
                  const label = getDateGroupLabel(
                    key,
                    todayStr,
                    yesterdayStr,
                    t('activity.today'),
                    t('activity.yesterday')
                  )
                  items.push(
                    <div
                      key={`group-${key}`}
                      className="flex items-center gap-3 pb-1 pt-5 first:pt-3"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        {label}
                      </span>
                      <div className="flex-1 border-t border-zinc-800/60" />
                    </div>
                  )
                }

                items.push(<EventRow key={event.id} event={event} />)
                return items
              })
            })()}
          </div>
        )}

        {/* Load more button */}
        {hasMore && (
          <div className="border-t border-zinc-800 px-4 py-4 text-center">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              {t('activity.loadMore', { count: Math.min(PAGE_SIZE, remaining) })}
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      {visible.length > 0 && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-600">
            {t('activity.showingCount', { count: filtered.length })}
            {search && ` ${t('activity.matchingQuery', { query: search })}`}{' '}
            {t('activity.lastThirtyDays')}
          </p>
        </div>
      )}
    </div>
  )
}
