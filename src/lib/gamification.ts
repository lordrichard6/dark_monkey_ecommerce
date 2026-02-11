// Gamification System - Tiers, Achievements, Points

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type TierInfo = {
  tier: Tier
  name: string
  minSpend: number // in cents
  nextTier: Tier | null
  nextTierSpend: number | null
  color: string
  icon: string
}

// Tier thresholds (in cents)
const TIER_THRESHOLDS = {
  bronze: 0, // CHF 0+
  silver: 50000, // CHF 500+
  gold: 200000, // CHF 2000+
  platinum: 500000, // CHF 5000+
}

export function getTierFromSpend(totalSpentCents: number): Tier {
  if (totalSpentCents >= TIER_THRESHOLDS.platinum) return 'platinum'
  if (totalSpentCents >= TIER_THRESHOLDS.gold) return 'gold'
  if (totalSpentCents >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

export function getTierInfo(totalSpentCents: number): TierInfo {
  const tier = getTierFromSpend(totalSpentCents)

  const tierData: Record<Tier, Omit<TierInfo, 'tier'>> = {
    bronze: {
      name: 'Bronze Member',
      minSpend: TIER_THRESHOLDS.bronze,
      nextTier: 'silver',
      nextTierSpend: TIER_THRESHOLDS.silver,
      color: 'from-amber-700 to-amber-900',
      icon: '🥉',
    },
    silver: {
      name: 'Silver Member',
      minSpend: TIER_THRESHOLDS.silver,
      nextTier: 'gold',
      nextTierSpend: TIER_THRESHOLDS.gold,
      color: 'from-zinc-400 to-zinc-600',
      icon: '🥈',
    },
    gold: {
      name: 'Gold Member',
      minSpend: TIER_THRESHOLDS.gold,
      nextTier: 'platinum',
      nextTierSpend: TIER_THRESHOLDS.platinum,
      color: 'from-yellow-400 to-yellow-600',
      icon: '🥇',
    },
    platinum: {
      name: 'Platinum Member',
      minSpend: TIER_THRESHOLDS.platinum,
      nextTier: null,
      nextTierSpend: null,
      color: 'from-purple-400 to-purple-600',
      icon: '💎',
    },
  }

  return {
    tier,
    ...tierData[tier],
  }
}

export function getTierProgress(totalSpentCents: number): number {
  const tierInfo = getTierInfo(totalSpentCents)

  if (!tierInfo.nextTierSpend) {
    return 100 // Already at max tier
  }

  const progressCents = totalSpentCents - tierInfo.minSpend
  const requiredCents = tierInfo.nextTierSpend - tierInfo.minSpend

  return Math.min((progressCents / requiredCents) * 100, 100)
}

export function getSpendToNextTier(totalSpentCents: number): number | null {
  const tierInfo = getTierInfo(totalSpentCents)

  if (!tierInfo.nextTierSpend) {
    return null // Already at max tier
  }

  return tierInfo.nextTierSpend - totalSpentCents
}

// Achievement types
export type AchievementCondition =
  | 'order_count'
  | 'review_count'
  | 'total_spent'
  | 'tier'
  | 'referral_count'

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  tier: Tier
  pointsReward: number
  conditionType: AchievementCondition
  conditionValue: number
  isActive: boolean
}

// Check if user qualifies for achievement
export function checkAchievementQualification(
  achievement: Achievement,
  userStats: {
    orderCount: number
    reviewCount: number
    totalSpentCents: number
    currentTier: Tier
    referralCount: number
  }
): boolean {
  switch (achievement.conditionType) {
    case 'order_count':
      return userStats.orderCount >= achievement.conditionValue
    case 'review_count':
      return userStats.reviewCount >= achievement.conditionValue
    case 'total_spent':
      return userStats.totalSpentCents >= achievement.conditionValue
    case 'tier': {
      const tierOrder: Tier[] = ['bronze', 'silver', 'gold', 'platinum']
      const userTierIndex = tierOrder.indexOf(userStats.currentTier)
      const requiredTierIndex = achievement.conditionValue
      return userTierIndex >= requiredTierIndex
    }
    case 'referral_count':
      return userStats.referralCount >= achievement.conditionValue
    default:
      return false
  }
}

// Points earning rules
export const POINTS_RULES = {
  PURCHASE: 10, // 10 points per CHF 1 spent (1000 cents = 10 points)
  REVIEW: 50, // Points for writing a review
  REFERRAL_SIGNUP: 200, // When referred friend signs up
  REFERRAL_PURCHASE: 500, // When referred friend makes first purchase
  ACHIEVEMENT: 0, // Varies by achievement
  BIRTHDAY: 500, // Birthday bonus
} as const

export function calculatePurchasePoints(priceCents: number): number {
  return Math.floor(priceCents / 100) // 1 point per CHF 1
}

// Points redemption values (more conservative rates for sustainability)
export const POINTS_REDEMPTION = {
  500: 500, // 500 points = CHF 5 discount (1% return rate)
  1000: 1200, // 1000 points = CHF 12 discount (1.2% return rate)
  2500: 3000, // 2500 points = CHF 30 discount (1.2% return rate)
  5000: 6500, // 5000 points = CHF 65 discount (1.3% return rate)
} as const
