/**
 * Gamification: XP, tiers, badges, missions
 */

export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 100,
  gold: 500,
  vip: 2000,
} as const

export type Tier = keyof typeof TIER_THRESHOLDS

export function getTierForXp(totalXp: number): Tier {
  if (totalXp >= TIER_THRESHOLDS.vip) return 'vip'
  if (totalXp >= TIER_THRESHOLDS.gold) return 'gold'
  if (totalXp >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

export function getXpToNextTier(totalXp: number): { tier: Tier; xpNeeded: number } | null {
  const tiers: Tier[] = ['bronze', 'silver', 'gold', 'vip']
  const idx = tiers.indexOf(getTierForXp(totalXp))
  if (idx >= tiers.length - 1) return null
  const nextTier = tiers[idx + 1]
  const threshold = TIER_THRESHOLDS[nextTier]
  return { tier: nextTier, xpNeeded: Math.max(0, threshold - totalXp) }
}

export function getXpProgress(totalXp: number): { current: number; next: number; percent: number } | null {
  const toNext = getXpToNextTier(totalXp)
  if (!toNext) return null
  const currentTier = getTierForXp(totalXp)
  const currentThreshold = TIER_THRESHOLDS[currentTier]
  const nextThreshold = TIER_THRESHOLDS[toNext.tier]
  const range = nextThreshold - currentThreshold
  const progress = totalXp - currentThreshold
  const percent = Math.min(100, Math.round((progress / range) * 100))
  return {
    current: progress,
    next: range,
    percent,
  }
}

/** XP per CHF spent (rounded) */
export const XP_PER_CHF = 1

export function xpForPurchase(totalCents: number): number {
  const chf = totalCents / 100
  return Math.max(10, Math.round(chf * XP_PER_CHF))
}
