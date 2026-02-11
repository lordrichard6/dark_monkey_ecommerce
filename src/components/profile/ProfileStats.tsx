'use client'

import { TierBadge } from './TierBadge'
import { getTierInfo, getTierProgress, getSpendToNextTier } from '@/lib/gamification'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { Package, Star, Heart, Calendar, TrendingUp, Award } from 'lucide-react'

type Props = {
  stats: {
    totalOrders: number
    totalSpentCents: number
    reviewCount: number
    wishlistSize: number
    memberSince: Date
    currentTier: string
    totalPoints: number
  }
}

export function ProfileStats({ stats }: Props) {
  const { format } = useCurrency()
  const tierInfo = getTierInfo(stats.totalSpentCents)
  const progress = getTierProgress(stats.totalSpentCents)
  const spendToNext = getSpendToNextTier(stats.totalSpentCents)

  const memberDays = Math.floor(
    (Date.now() - new Date(stats.memberSince).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      {/* Tier Card */}
      <div className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-50">Your Tier</h3>
          <TierBadge totalSpentCents={stats.totalSpentCents} size="md" />
        </div>

        {/* Progress to next tier */}
        {tierInfo.nextTier && spendToNext !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Progress to {tierInfo.nextTier}</span>
              <span className="font-medium text-zinc-300">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full bg-gradient-to-r ${tierInfo.color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Spend {format(spendToNext)} more to unlock {tierInfo.nextTier} tier
            </p>
          </div>
        )}

        {tierInfo.tier === 'platinum' && (
          <div className="rounded-lg bg-purple-500/10 p-3 text-center">
            <p className="text-sm font-medium text-purple-400">
              🎉 You've reached the highest tier!
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {/* Total Orders */}
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Orders"
          value={stats.totalOrders.toString()}
          color="text-blue-400"
        />

        {/* Total Spent */}
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Spent"
          value={format(stats.totalSpentCents)}
          color="text-green-400"
        />

        {/* Reviews */}
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Reviews"
          value={stats.reviewCount.toString()}
          color="text-yellow-400"
        />

        {/* Wishlist */}
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Wishlist"
          value={stats.wishlistSize.toString()}
          color="text-red-400"
        />

        {/* Member Since */}
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Member For"
          value={`${memberDays} days`}
          color="text-purple-400"
        />

        {/* Points */}
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Points"
          value={stats.totalPoints.toLocaleString()}
          color="text-amber-400"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700">
      <div className="mb-2 flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-zinc-50">{value}</div>
    </div>
  )
}
