import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { CustomerDetailTabs } from './customer-detail-tabs'
import { getLocale } from 'next-intl/server'
import { getSpendToNextTier } from '@/lib/gamification'
import md5 from 'md5'

type Props = { params: Promise<{ id: string }> }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function TierBadge({ tier }: { tier: string | null }) {
  const map: Record<string, string> = {
    bronze: 'bg-amber-900/30 text-amber-600 ring-amber-700/30',
    silver: 'bg-zinc-500/20 text-zinc-300 ring-zinc-500/20',
    gold: 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/20',
    platinum: 'bg-purple-500/20 text-purple-400 ring-purple-500/20',
  }
  const t = tier ?? 'bronze'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${map[t] ?? map.bronze}`}
    >
      {t}
    </span>
  )
}

const NEXT_TIER: Record<string, string> = {
  bronze: 'Silver',
  silver: 'Gold',
  gold: 'Platinum',
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const { id } = await params
  const locale = await getLocale()

  // ── Auth enrichment (graceful fallback) ──
  let authEmail = '—'
  let authEmailConfirmedAt: string | null = null
  let authCreatedAt = ''
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(id)
    if (authData?.user) {
      authEmail = authData.user.email ?? '—'
      authEmailConfirmedAt = authData.user.email_confirmed_at ?? null
      authCreatedAt = authData.user.created_at
    }
  } catch {
    // auth admin unavailable — fall back to profile data
  }

  // ── Primary: user_profiles + all related data ──
  const [profileRes, ordersRes, reviewsRes, wishlistRes, xpRes, ticketsRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select(
        'id, display_name, avatar_url, current_tier, total_xp, total_orders, total_spent_cents, tier_progress, created_at'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('orders')
      .select('id, status, total_cents, currency, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('product_reviews')
      .select('id, rating, comment, created_at, products(name, slug)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_wishlist')
      .select('id, created_at, products(name, slug)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_xp_events')
      .select('id, event_type, amount, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('support_tickets')
      .select('id, subject, category, status, created_at, updated_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!profileRes.data) notFound()

  const profile = profileRes.data
  const orders = ordersRes.data ?? []
  const reviews = reviewsRes.data ?? []
  const wishlist = wishlistRes.data ?? []
  const xpEvents = xpRes.data ?? []
  const tickets = ticketsRes.data ?? []

  const displayName = profile.display_name ?? authEmail.split('@')[0] ?? 'Unknown'
  const tier = profile.current_tier ?? 'bronze'
  const tierProgress = Number(profile.tier_progress ?? 0)
  const joinedAt = authCreatedAt || profile.created_at

  // Avatar: prefer stored url, then gravatar
  const getGravatar = (email: string) => {
    const hash = md5(email.toLowerCase().trim())
    return `https://www.gravatar.com/avatar/${hash}?d=404&s=112`
  }
  const avatarUrl = profile.avatar_url ?? (authEmail !== '—' ? getGravatar(authEmail) : null)

  // Tier progress context
  const spendToNext = getSpendToNextTier(profile.total_spent_cents ?? 0)
  const nextTierName = NEXT_TIER[tier]

  return (
    <div className="p-6 md:p-8">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="text-sm text-zinc-400 transition-colors hover:text-amber-400"
      >
        ← Back to customers
      </Link>

      {/* ── Hero card ── */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {avatarUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-amber-500/20">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xl font-bold text-amber-400 ring-2 ring-amber-500/20">
                {displayName[0]?.toUpperCase() ?? '?'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-50">{displayName}</h1>
                <TierBadge tier={tier} />
              </div>
              <p className="mt-0.5 font-mono text-sm text-zinc-400">{authEmail}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Joined{' '}
                {new Date(joinedAt).toLocaleDateString(locale, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Orders', value: profile.total_orders ?? orders.length },
            { label: 'Total Spent', value: formatPrice(profile.total_spent_cents ?? 0) },
            { label: 'Total XP', value: (profile.total_xp ?? 0).toLocaleString() },
            { label: 'Reviews', value: reviews.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-zinc-50">{value}</p>
            </div>
          ))}
        </div>

        {/* Tier progress bar */}
        {tier !== 'platinum' && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progress to next tier</span>
              <div className="flex items-center gap-2">
                {spendToNext !== null && nextTierName && (
                  <span className="text-zinc-600">
                    {formatPrice(spendToNext)} more to reach{' '}
                    <span className="font-medium text-zinc-400">{nextTierName}</span>
                  </span>
                )}
                <span className="font-medium text-amber-500">{tierProgress.toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, tierProgress))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabbed detail sections ── */}
      <CustomerDetailTabs
        userId={id}
        currentTier={tier}
        email={authEmail}
        emailConfirmedAt={authEmailConfirmedAt}
        displayName={profile.display_name ?? null}
        locale={locale}
        orders={orders.map((o) => ({
          id: o.id,
          status: o.status,
          total_cents: o.total_cents,
          currency: o.currency,
          created_at: o.created_at,
        }))}
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? null,
          created_at: r.created_at,
          product: Array.isArray(r.products)
            ? (r.products[0] ?? null)
            : (r.products as { name: string; slug: string } | null),
        }))}
        wishlist={wishlist.map((w) => ({
          id: w.id,
          created_at: w.created_at,
          product: Array.isArray(w.products)
            ? (w.products[0] ?? null)
            : (w.products as { name: string; slug: string } | null),
        }))}
        xpEvents={xpEvents.map((e) => ({
          id: e.id,
          event_type: e.event_type,
          amount: e.amount,
          created_at: e.created_at,
        }))}
        tickets={tickets.map((t) => ({
          id: t.id,
          subject: t.subject,
          category: t.category,
          status: t.status,
          created_at: t.created_at,
          updated_at: t.updated_at,
        }))}
      />
    </div>
  )
}
