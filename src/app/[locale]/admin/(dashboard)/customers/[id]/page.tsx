import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { CustomerDetailTabs } from './customer-detail-tabs'

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

export default async function AdminCustomerDetailPage({ params }: Props) {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const { id } = await params

  // Fetch auth user (for email + created_at)
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(id)
  if (authError || !authData?.user) notFound()
  const authUser = authData.user

  // Fetch profile + related data in parallel
  const [profileRes, ordersRes, reviewsRes, wishlistRes, xpRes] = await Promise.all([
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
      .order('created_at', { ascending: false })
      .limit(100),
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
      .select('id, event_type, amount, metadata, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const profile = profileRes.data
  const orders = ordersRes.data ?? []
  const reviews = reviewsRes.data ?? []
  const wishlist = wishlistRes.data ?? []
  const xpEvents = xpRes.data ?? []

  const displayName = profile?.display_name ?? authUser.email?.split('@')[0] ?? 'Unknown'
  const initial = displayName[0].toUpperCase()
  const tier = profile?.current_tier ?? 'bronze'
  const tierProgress = Number(profile?.tier_progress ?? 0)

  return (
    <div className="p-6 md:p-8">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="text-sm text-zinc-400 hover:text-amber-400 transition-colors"
      >
        ← Back to customers
      </Link>

      {/* Header card */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xl font-bold text-amber-400">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-50">{displayName}</h1>
                <TierBadge tier={tier} />
              </div>
              <p className="mt-0.5 text-sm text-zinc-400">{authUser.email}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Joined{' '}
                {new Date(authUser.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {profile?.total_orders ?? orders.length}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500">Total Spent</p>
            <p className="mt-1 text-xl font-bold text-zinc-50">
              {formatPrice(profile?.total_spent_cents ?? 0)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500">Total XP</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">{profile?.total_xp ?? 0}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500">Reviews</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">{reviews.length}</p>
          </div>
        </div>

        {/* Tier progress bar */}
        {tier !== 'platinum' && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
              <span>Progress to next tier</span>
              <span>{tierProgress.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, tierProgress)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabbed detail sections */}
      <CustomerDetailTabs
        userId={id}
        currentTier={tier}
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
      />
    </div>
  )
}
