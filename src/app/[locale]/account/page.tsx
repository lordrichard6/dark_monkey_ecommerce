import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProfileEditForm } from '@/components/account/ProfileEditForm'
import { AddressList } from '@/components/account/AddressList'
import { ReferralCard } from '@/components/account/ReferralCard'
import { ProgressCard } from '@/components/gamification/ProgressCard'
import { BadgesList } from '@/components/gamification/BadgesList'
import { MissionsProgress } from '@/components/gamification/MissionsProgress'

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

  const [
    { data: profile },
    { data: addresses },
    { data: badges },
    { data: userBadges },
    { count: orderCount },
  ] = await Promise.all([
    supabase.from('user_profiles').select('display_name, tier, total_xp').eq('id', user.id).single(),
    supabase
      .from('addresses')
      .select('id, type, full_name, line1, line2, city, postal_code, country, phone, is_default')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase.from('badges').select('id, code, name, description, icon').order('sort_order', { ascending: true }),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
  ])

  const earnedBadgeIds = (userBadges ?? []).map((ub) => ub.badge_id)

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-12">
        <h1 className="text-2xl font-bold text-zinc-50">{t('title')}</h1>

        {/* Gamification: tier, XP, progress */}
        {profile && (
          <section>
            <ProgressCard tier={profile.tier as 'bronze' | 'silver' | 'gold' | 'vip'} totalXp={profile.total_xp} />
          </section>
        )}

        <section className="grid gap-6 sm:grid-cols-2">
          <BadgesList badges={badges ?? []} earned={earnedBadgeIds} />
          <MissionsProgress
            orderCount={orderCount ?? 0}
            hasDisplayName={!!profile?.display_name?.trim()}
            earnedBadges={earnedBadgeIds}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('profile')}</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
            <p className="text-zinc-400">
              <span className="font-medium text-zinc-300">{t('emailLabel')}:</span> {user.email}
            </p>
            <div className="mt-6 border-t border-zinc-800 pt-6">
              <ProfileEditForm displayName={profile?.display_name ?? null} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('addresses')}</h2>
          <AddressList addresses={addresses ?? []} />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('wishlist')}</h2>
          <Link
            href="/account/wishlist"
            className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700"
          >
            {t('viewWishlist')}
          </Link>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('orders')}</h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700"
          >
            {t('viewOrderHistory')}
          </Link>
        </section>

        <section>
          <ReferralCard />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('security')}</h2>
          <Link
            href="/forgot-password"
            className="text-sm text-zinc-400 hover:text-zinc-300"
          >
            {t('changePassword')}
          </Link>
        </section>
      </div>
    </div>
  )
}
