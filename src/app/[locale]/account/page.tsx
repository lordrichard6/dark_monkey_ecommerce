import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { PointsDisplay } from '@/components/profile/PointsDisplay'
import { ReferralCard } from '@/components/profile/ReferralCard'
import { AchievementGrid } from '@/components/profile/AchievementBadge'
import { Edit, ShoppingBag, Heart, Shield } from 'lucide-react'
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
  ])

  const unlockedAchievementIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || [])

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
    <div className="min-h-screen bg-black py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header with Avatar */}
        <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {avatarUrl ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-zinc-800 bg-zinc-900">
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-zinc-800 bg-gradient-to-br from-amber-500 to-amber-600 text-2xl font-bold text-white">
                {getInitials()}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-zinc-50">
                {profile?.display_name || user.email?.split('@')[0] || t('title')}
              </h1>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
          </div>

          <Link
            href="/account/edit-profile"
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
          >
            <Edit className="h-4 w-4" />
            {t('editProfile')}
          </Link>
        </div>

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
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                  <AchievementGrid
                    achievements={achievements}
                    unlockedIds={unlockedAchievementIds}
                  />
                </div>
              </section>
            )}

            {/* Quick Links */}
            <section className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/account/orders"
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <ShoppingBag className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-50">{t('orders')}</p>
                  <p className="text-sm text-zinc-500">{t('viewOrderHistory')}</p>
                </div>
              </Link>

              <Link
                href="/account/wishlist"
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <Heart className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-50">{t('wishlist')}</p>
                  <p className="text-sm text-zinc-500">{t('viewWishlist')}</p>
                </div>
              </Link>

              <Link
                href="/account/addresses"
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <div className="flex h-5 w-5 items-center justify-center">
                  <span className="text-lg">📍</span>
                </div>
                <div>
                  <p className="font-medium text-zinc-50">{t('addresses')}</p>
                  <p className="text-sm text-zinc-500">{t('viewAddresses')}</p>
                </div>
              </Link>

              <Link
                href="/account/privacy"
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <Shield className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-50">{t('privacy')}</p>
                  <p className="text-sm text-zinc-500">{t('viewPrivacy')}</p>
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
