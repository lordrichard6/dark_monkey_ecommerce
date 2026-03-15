'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ActivityEvent } from './page'

const FILTERS = ['All', 'Signups', 'Verifications', 'Purchases'] as const
type Filter = (typeof FILTERS)[number]

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return (
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

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

function EventRow({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <EventIcon type={event.type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
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

          {event.type === 'signup' && <span className="text-zinc-500">created an account</span>}

          {event.type === 'verified' && <span className="text-zinc-500">verified their email</span>}

          {event.type === 'purchase' && (
            <>
              <span className="text-zinc-500">purchased</span>
              {event.productNames && event.productNames.length > 0 && (
                <span className="text-zinc-200">
                  {event.productNames.slice(0, 2).join(', ')}
                  {event.productNames.length > 2 && (
                    <span className="text-zinc-500"> +{event.productNames.length - 2} more</span>
                  )}
                </span>
              )}
              <span className="text-zinc-500">for</span>
              <span className="font-semibold text-amber-400">
                {formatPrice(event.totalCents ?? 0, event.currency ?? 'CHF')}
              </span>
              {event.isGuest && (
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  guest
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-xs text-zinc-600">{formatTimestamp(event.timestamp)}</p>
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

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const [filter, setFilter] = useState<Filter>('All')

  const counts: Record<Filter, number> = {
    All: events.length,
    Signups: events.filter((e) => e.type === 'signup').length,
    Verifications: events.filter((e) => e.type === 'verified').length,
    Purchases: events.filter((e) => e.type === 'purchase').length,
  }

  const filtered = events.filter((e) => {
    if (filter === 'Signups') return e.type === 'signup'
    if (filter === 'Verifications') return e.type === 'verified'
    if (filter === 'Purchases') return e.type === 'purchase'
    return true
  })

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-zinc-800 p-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f}
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

      {/* Event list */}
      <div className="divide-y divide-zinc-800/40 px-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">No events in the last 30 days.</p>
        ) : (
          filtered.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>

      {filtered.length > 0 && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-600">
            Showing {filtered.length} event{filtered.length !== 1 ? 's' : ''} · last 30 days
          </p>
        </div>
      )}
    </div>
  )
}
