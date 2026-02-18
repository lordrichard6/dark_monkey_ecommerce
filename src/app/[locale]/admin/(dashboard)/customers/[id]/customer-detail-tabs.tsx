'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { overrideCustomerTier } from '@/actions/admin-customers'

type Order = {
  id: string
  status: string
  total_cents: number
  currency: string
  created_at: string
}

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  product: { name: string; slug: string } | null
}

type WishlistItem = {
  id: string
  created_at: string
  product: { name: string; slug: string } | null
}

type XpEvent = {
  id: string
  event_type: string
  amount: number
  created_at: string
}

type Props = {
  userId: string
  currentTier: string
  orders: Order[]
  reviews: Review[]
  wishlist: WishlistItem[]
  xpEvents: XpEvent[]
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    processing: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    shipped: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 ring-red-500/20',
    refunded: 'bg-red-500/10 text-red-400 ring-red-500/20',
    pending: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${map[status] ?? map.pending}`}
    >
      {status}
    </span>
  )
}

const TABS = ['Orders', 'Reviews', 'Wishlist', 'XP Log'] as const
type Tab = (typeof TABS)[number]

export function CustomerDetailTabs({
  userId,
  currentTier,
  orders,
  reviews,
  wishlist,
  xpEvents,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Orders')
  const [tier, setTier] = useState(currentTier)
  const [tierSaved, setTierSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleTierSave() {
    startTransition(async () => {
      const result = await overrideCustomerTier(userId, tier)
      if (result.ok) setTierSaved(true)
    })
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Tier override */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="mb-3 text-sm font-medium text-zinc-300">Manual Tier Override</p>
        <div className="flex items-center gap-3">
          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value)
              setTierSaved(false)
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <button
            onClick={handleTierSave}
            disabled={isPending || tier === currentTier}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
          {tierSaved && <span className="text-sm text-emerald-400">✓ Saved</span>}
        </div>
      </div>

      {/* Tab navigation */}
      <div>
        <div className="flex gap-1 border-b border-zinc-800">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-amber-500 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab}
              <span className="ml-1.5 rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                {tab === 'Orders'
                  ? orders.length
                  : tab === 'Reviews'
                    ? reviews.length
                    : tab === 'Wishlist'
                      ? wishlist.length
                      : xpEvents.length}
              </span>
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === 'Orders' && (
          <div className="mt-4 space-y-2">
            {orders.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">No orders yet.</p>
            )}
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-500">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-zinc-100">{formatPrice(o.total_cents)}</span>
                  <span className="text-zinc-500">
                    {new Date(o.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'Reviews' && (
          <div className="mt-4 space-y-3">
            {reviews.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">No reviews yet.</p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {r.product && (
                      <Link
                        href={`/products/${r.product.slug}`}
                        className="text-sm font-medium text-amber-400 hover:text-amber-300"
                      >
                        {r.product.name}
                      </Link>
                    )}
                    <div className="mt-1 flex items-center gap-1">
                      {'★'.repeat(r.rating)}
                      <span className="text-zinc-600">{'★'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-zinc-300">{r.comment}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {new Date(r.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wishlist tab */}
        {activeTab === 'Wishlist' && (
          <div className="mt-4 space-y-2">
            {wishlist.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">Wishlist is empty.</p>
            )}
            {wishlist.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                {w.product ? (
                  <Link
                    href={`/products/${w.product.slug}`}
                    className="text-sm font-medium text-amber-400 hover:text-amber-300"
                  >
                    {w.product.name}
                  </Link>
                ) : (
                  <span className="text-sm text-zinc-500">Deleted product</span>
                )}
                <span className="text-xs text-zinc-500">
                  {new Date(w.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* XP Log tab */}
        {activeTab === 'XP Log' && (
          <div className="mt-4 space-y-2">
            {xpEvents.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">No XP events yet.</p>
            )}
            {xpEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.amount >= 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {e.amount >= 0 ? '+' : ''}
                    {e.amount} XP
                  </span>
                  <span className="text-sm text-zinc-300 capitalize">
                    {e.event_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(e.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
