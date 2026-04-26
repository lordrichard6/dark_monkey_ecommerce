import Link from 'next/link'
import { AccountAvatar } from '@/components/account/AccountAvatar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { PointsDisplay } from '@/components/profile/PointsDisplay'
import { ReferralCard } from '@/components/profile/ReferralCard'
import { AchievementGrid } from '@/components/profile/AchievementBadge'
import { Edit, ShoppingBag, Heart, Shield, Bell, LifeBuoy, Palette } from 'lucide-react'
import { NotificationsBadge } from '@/components/account/NotificationsBadge'
import { ExclusiveProductShowcase } from '@/components/account/ExclusiveProductShowcase'
import { buildProductImageAlt } from '@/lib/product-image-alt'
import md5 from 'md5'

export default async function AccountPage() {
  const t = await getTranslations('account')
  const supabase = await createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    //
  }

  if (!user) redirect('/login?redirectTo=/account')

  // Auto-claim guest orders matching email
  if (user.email) {
    const { claimGuestOrdersForUser } = await import('@/lib/orders-claim')
    await claimGuestOrdersForUser(user.id, user.email)
  }

  // Fetch comprehensive profile data
  const [
    { data: profile },
    { data: pointsTransactions },
    { data: achievements },
    { data: userAchievements },
    { data: wishlistItems, count: wishlistCount },
    { data: orders, count: ordersCount },
    { count: openTicketsCount },
    { data: exclusiveProducts },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true }),
    supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
    supabase
      .from('user_wishlist')
      .select('product_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['open', 'in_progress']),
    supabase
      .from('products')
      .select(
        `id, name, slug, created_at, dual_image_mode, is_featured,
         product_images (url, alt, sort_order),
         product_variants (price_cents, compare_at_price_cents)`
      )
      .eq('is_exclusive', true)
      .eq('exclusive_user_id', user.id)
      .eq('is_active', true),
  ])

  const unlockedAchievementIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || [])

  // Wishlist set for exclusive products
  const exclusiveProductIds = (exclusiveProducts ?? []).map((p) => p.id)
  let exclusiveWishlistSet = new Set<string>()
  if (exclusiveProductIds.length > 0) {
    const { data: wl } = await supabase
      .from('user_wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', exclusiveProductIds)
    exclusiveWishlistSet = new Set((wl ?? []).map((w) => w.product_id))
  }

  // Get Gravatar URL
  const getGravatarUrl = (email: string) => {
    const hash = md5(email.toLowerCase().trim())
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`
  }

  // Get initials for generated avatar
  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const avatarUrl = profile?.avatar_url || (user.email ? getGravatarUrl(user.email) : null)

  const stats = {
    totalOrders: ordersCount ?? 0,
    totalSpentCents: profile?.total_spent_cents || 0,
    reviewCount: profile?.review_count || 0,
    wishlistSize: wishlistCount ?? 0,
    memberSince: new Date(profile?.created_at || user.created_at),
    currentTier: profile?.current_tier || 'bronze',
    totalPoints: profile?.total_xp || 0,
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: 'transparent' }}>
      {/* ── Hero banner ── */}
      <div className="relative mb-10 overflow-hidden">
        {/* Amber glow base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 120% at 50% 0%, rgba(251,191,36,0.13) 0%, rgba(251,146,60,0.07) 40%, transparent 70%)',
          }}
        />
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Top amber line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050508] to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar — larger, glowing ring */}
              <AccountAvatar avatarUrl={avatarUrl} initials={getInitials()} />

              <div>
                <h1 className="text-3xl font-bold text-zinc-50 drop-shadow-sm">
                  {profile?.display_name || user.email?.split('@')[0] || t('title')}
                </h1>
                <p className="mt-0.5 text-sm text-zinc-400">{user.email}</p>
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {stats.currentTier} member
                </p>
              </div>
            </div>

            <Link
              href="/account/edit-profile"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
            >
              <Edit className="h-4 w-4" />
              {t('editProfile')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Stats Dashboard */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('statistics')}</h2>
              <ProfileStats stats={stats} />
            </section>

            {/* Achievements */}
            {achievements && achievements.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('achievements')}</h2>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm">
                  <AchievementGrid
                    achievements={achievements}
                    unlockedIds={unlockedAchievementIds}
                  />
                </div>
              </section>
            )}

            {/* ── Exclusive Products Showcase ── */}
            <ExclusiveProductShowcase
              products={(exclusiveProducts ?? []).map((p) => {
                const imgs = (
                  p.product_images as { url: string; alt: string | null; sort_order: number }[]
                ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                const variants = p.product_variants as {
                  price_cents: number
                  compare_at_price_cents: number | null
                }[]
                const minPrice = variants?.length
                  ? Math.min(...variants.map((v) => v.price_cents))
                  : 0
                const compareAt =
                  variants?.find(
                    (v) => v.compare_at_price_cents && v.compare_at_price_cents > v.price_cents
                  )?.compare_at_price_cents ?? null
                return {
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  priceCents: minPrice,
                  compareAtPriceCents: compareAt,
                  imageUrl: imgs[0]?.url ?? '',
                  imageAlt: buildProductImageAlt(p.name, imgs[0]?.alt),
                  imageUrl2: imgs[1]?.url ?? null,
                  dualImageMode:
                    ((p as Record<string, unknown>).dual_image_mode as boolean) ?? false,
                  isFeatured: ((p as Record<string, unknown>).is_featured as boolean) ?? false,
                  isInWishlist: exclusiveWishlistSet.has(p.id),
                  createdAt: p.created_at,
                }
              })}
            />

            {/* Quick Links */}
            <section className="grid gap-3 sm:grid-cols-2">
              {/* Orders */}
              <Link
                href="/account/orders"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-amber-500/5"
              >
                <span className="text-zinc-500 transition-colors group-hover:text-amber-400">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-50">{t('orders')}</p>
                  <p className="text-sm text-zinc-500">{t('viewOrderHistory')}</p>
                </div>
              </Link>

              {/* Wishlist — with live count badge */}
              <Link
                href="/account/wishlist"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-amber-500/5"
              >
                <span className="text-zinc-500 transition-colors group-hover:text-amber-400">
                  <Heart className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-50">{t('wishlist')}</p>
                    {stats.wishlistSize > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-bold text-amber-400">
                        {stats.wishlistSize}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{t('viewWishlist')}</p>
                </div>
              </Link>

              {/* Addresses */}
              <Link
                href="/account/addresses"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-amber-500/5"
              >
                <span className="text-zinc-500 transition-colors group-hover:text-amber-400">
                  <span className="text-lg leading-none">📍</span>
                </span>
                <div>
                  <p className="font-medium text-zinc-50">{t('addresses')}</p>
                  <p className="text-sm text-zinc-500">{t('viewAddresses')}</p>
                </div>
              </Link>

              {/* Privacy */}
              <Link
                href="/account/privacy"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-amber-500/5"
              >
                <span className="text-zinc-500 transition-colors group-hover:text-amber-400">
                  <Shield className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-50">{t('privacy')}</p>
                  <p className="text-sm text-zinc-500">{t('viewPrivacy')}</p>
                </div>
              </Link>

              {/* Notifications */}
              <Link
                href="/account/notifications"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-amber-500/5"
              >
                <span className="text-zinc-500 transition-colors group-hover:text-amber-400">
                  <Bell className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-50">{t('notifications')}</p>
                    <NotificationsBadge />
                  </div>
                  <p className="text-sm text-zinc-500">{t('viewNotifications')}</p>
                </div>
              </Link>

              {/* Support */}
              <Link
                href="/account/support"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-amber-500/5"
              >
                <span className="text-zinc-500 transition-colors group-hover:text-amber-400">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-50">{t('support')}</p>
                    {(openTicketsCount ?? 0) > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500/20 px-1.5 text-xs font-bold text-blue-400">
                        {openTicketsCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{t('viewSupport')}</p>
                </div>
              </Link>

              {/* Custom Products — full-width golden featured card */}
              <Link
                href="/account/customize"
                className="custom-products-shimmer group relative col-span-2 overflow-hidden rounded-xl border border-amber-500/25 p-px transition-all duration-300 hover:border-amber-400/50 hover:shadow-[0_0_28px_rgba(251,191,36,0.12)]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(120,80,10,0.55) 0%, rgba(60,40,5,0.6) 40%, rgba(100,65,8,0.55) 100%)',
                }}
              >
                {/* inner surface */}
                <div className="flex items-center gap-4 rounded-[11px] bg-zinc-950/60 px-5 py-4 backdrop-blur-sm">
                  {/* icon with golden glow ring */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-500/30 transition-all duration-300 group-hover:bg-amber-500/25 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    <Palette className="h-5 w-5" />
                  </span>

                  <div className="flex-1">
                    <p className="font-semibold text-amber-100 transition-colors group-hover:text-amber-50">
                      {t('customProducts')}
                    </p>
                    <p className="text-sm text-amber-400/60 transition-colors group-hover:text-amber-400/80">
                      {t('viewCustomProducts')}
                    </p>
                  </div>

                  {/* arrow */}
                  <svg
                    className="h-4 w-4 shrink-0 text-amber-500/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Points */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('points')}</h2>
              <PointsDisplay
                totalPoints={stats.totalPoints}
                userId={user.id}
                transactions={pointsTransactions || []}
              />
            </section>

            {/* Referral */}
            <section>
              <ReferralCard userId={user.id} referralCount={profile?.referral_count || 0} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
