'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Copy, Check, Link2, AlertTriangle } from 'lucide-react'
import {
  overrideCustomerTier,
  confirmUserEmail,
  updateUserDisplayName,
  generateCustomerSignInLink,
} from '@/actions/admin-customers'

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

type Ticket = {
  id: string
  subject: string
  category: string
  status: string
  created_at: string
  updated_at: string
}

type Props = {
  userId: string
  currentTier: string
  email: string
  emailConfirmedAt: string | null
  displayName: string | null
  locale: string
  orders: Order[]
  reviews: Review[]
  wishlist: WishlistItem[]
  xpEvents: XpEvent[]
  tickets: Ticket[]
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Fix #5: semantically correct status colors
function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    processing: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    shipped: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
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

function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    closed: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  }
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[status] ?? map.closed}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

const XP_PAGE_SIZE = 10

const TABS = ['Orders', 'Reviews', 'Wishlist', 'XP Log', 'Tickets'] as const
type Tab = (typeof TABS)[number]

export function CustomerDetailTabs({
  userId,
  currentTier,
  email,
  emailConfirmedAt,
  displayName: initialDisplayName,
  locale,
  orders,
  reviews,
  wishlist,
  xpEvents,
  tickets,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Orders')

  // Tier override
  const [tier, setTier] = useState(currentTier)
  const [tierSaved, setTierSaved] = useState(false)
  const [isTierPending, startTierTransition] = useTransition()

  // Email confirmation
  const [emailConfirmed, setEmailConfirmed] = useState(!!emailConfirmedAt)
  const [isConfirmPending, startConfirmTransition] = useTransition()
  const [confirmError, setConfirmError] = useState<string | null>(null)

  // Display name — Fix #4: track last-saved value in a ref
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '')
  const savedNameRef = useRef(initialDisplayName ?? '')
  const [nameSaved, setNameSaved] = useState(false)
  const [isNamePending, startNameTransition] = useTransition()
  const [nameError, setNameError] = useState<string | null>(null)

  // Sign-in link generation
  const [signInLink, setSignInLink] = useState<string | null>(null)
  const [isLinkPending, startLinkTransition] = useTransition()
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // XP log pagination — Fix #10
  const [xpVisible, setXpVisible] = useState(XP_PAGE_SIZE)

  function handleTierSave() {
    startTierTransition(async () => {
      const result = await overrideCustomerTier(userId, tier)
      if (result.ok) setTierSaved(true)
    })
  }

  function handleConfirmEmail() {
    startConfirmTransition(async () => {
      setConfirmError(null)
      const result = await confirmUserEmail(userId)
      if (result.ok) setEmailConfirmed(true)
      else setConfirmError(result.error ?? 'Failed to confirm email')
    })
  }

  function handleNameSave() {
    startNameTransition(async () => {
      setNameError(null)
      setNameSaved(false)
      const result = await updateUserDisplayName(userId, displayName)
      if (result.ok) {
        savedNameRef.current = displayName.trim() // Fix #4: update ref
        setNameSaved(true)
      } else {
        setNameError(result.error ?? 'Failed to update name')
      }
    })
  }

  function handleGenerateLink() {
    startLinkTransition(async () => {
      setLinkError(null)
      setSignInLink(null)
      setLinkCopied(false)
      const result = await generateCustomerSignInLink(userId)
      if (result.ok && result.link) setSignInLink(result.link)
      else setLinkError(result.error ?? 'Failed to generate link')
    })
  }

  function copyLink() {
    if (!signInLink) return
    navigator.clipboard.writeText(signInLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    })
  }

  const tabCounts: Record<Tab, number> = {
    Orders: orders.length,
    Reviews: reviews.length,
    Wishlist: wishlist.length,
    'XP Log': xpEvents.length,
    Tickets: tickets.length,
  }

  return (
    <div className="mt-6 space-y-6">
      {/* ── User Management card ── */}
      <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <p className="text-sm font-semibold text-zinc-200">User Management</p>

        {/* Email + confirmation */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-zinc-300">{email}</span>
            {emailConfirmed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                ✓ Verified
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                  ✗ Unverified
                </span>
                <button
                  onClick={handleConfirmEmail}
                  disabled={isConfirmPending}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {isConfirmPending ? 'Confirming…' : 'Confirm Email'}
                </button>
                {confirmError && <span className="text-xs text-red-400">{confirmError}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Display name */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Display Name
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setNameSaved(false)
              }}
              placeholder="Enter display name…"
              className="w-56 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={handleNameSave}
              disabled={isNamePending || displayName.trim() === savedNameRef.current}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
            >
              {isNamePending ? 'Saving…' : 'Save'}
            </button>
            {nameSaved && <span className="text-sm text-emerald-400">✓ Saved</span>}
            {nameError && <span className="text-sm text-red-400">{nameError}</span>}
          </div>
        </div>

        {/* Tier override */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Loyalty Tier
          </p>
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
              disabled={isTierPending || tier === currentTier}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
            >
              {isTierPending ? 'Saving…' : 'Save'}
            </button>
            {tierSaved && <span className="text-sm text-emerald-400">✓ Saved</span>}
          </div>
        </div>

        {/* ── Sign-in link (impersonate/view as) ── */}
        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Account Access
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateLink}
              disabled={isLinkPending}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400 disabled:opacity-40"
            >
              <Link2 className="h-3.5 w-3.5" />
              {isLinkPending ? 'Generating…' : 'Generate sign-in link'}
            </button>
            {linkError && <span className="text-xs text-red-400">{linkError}</span>}
          </div>

          {signInLink && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                One-time sign-in link — expires in 24h. Do not share publicly.
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={signInLink}
                  className="flex-1 truncate rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-400 focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  {linkCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div>
        <div className="flex gap-0.5 border-b border-zinc-800">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-amber-500 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === 'Orders' && (
          <div className="mt-4 space-y-2">
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No orders yet.</p>
            ) : (
              orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-zinc-500">#{o.id.slice(0, 8)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium tabular-nums text-zinc-100">
                      {formatPrice(o.total_cents)}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {fmtDate(o.created_at, locale)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'Reviews' && (
          <div className="mt-4 space-y-3">
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
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
                      <div className="mt-1 flex items-center gap-0.5 text-sm">
                        {'★'.repeat(r.rating)}
                        <span className="text-zinc-700">{'★'.repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-zinc-300">{r.comment}</p>}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                      {fmtDate(r.created_at, locale)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wishlist tab */}
        {activeTab === 'Wishlist' && (
          <div className="mt-4 space-y-2">
            {wishlist.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">Wishlist is empty.</p>
            ) : (
              wishlist.map((w) => (
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
                    <span className="text-sm italic text-zinc-500">Deleted product</span>
                  )}
                  <span className="text-xs tabular-nums text-zinc-500">
                    {fmtDate(w.created_at, locale)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* XP Log tab — Fix #10: paginated with load more */}
        {activeTab === 'XP Log' && (
          <div className="mt-4 space-y-2">
            {xpEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No XP events yet.</p>
            ) : (
              <>
                {xpEvents.slice(0, xpVisible).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                          e.amount >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {e.amount >= 0 ? '+' : ''}
                        {e.amount} XP
                      </span>
                      <span className="text-sm capitalize text-zinc-300">
                        {e.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {fmtDate(e.created_at, locale)}
                    </span>
                  </div>
                ))}
                {xpVisible < xpEvents.length && (
                  <button
                    onClick={() => setXpVisible((v) => v + XP_PAGE_SIZE)}
                    className="mt-2 w-full rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                  >
                    Load more ({xpEvents.length - xpVisible} remaining)
                  </button>
                )}
                <p className="pt-1 text-center text-xs text-zinc-600">
                  Showing {Math.min(xpVisible, xpEvents.length)} of {xpEvents.length} events
                </p>
              </>
            )}
          </div>
        )}

        {/* Tickets tab — Fix #9 */}
        {activeTab === 'Tickets' && (
          <div className="mt-4 space-y-2">
            {tickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No support tickets yet.</p>
            ) : (
              tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/support/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TicketStatusBadge status={t.status} />
                    <span className="truncate text-sm font-medium text-zinc-200">{t.subject}</span>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize text-zinc-500 ring-1 ring-zinc-700/50">
                      {t.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="ml-4 shrink-0 text-xs tabular-nums text-zinc-500">
                    {fmtDate(t.created_at, locale)}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
