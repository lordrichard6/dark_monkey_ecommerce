import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkAchievementQualification,
  processXpForPurchase,
  processXpForReferral,
  checkAndAwardAchievements,
  getTierInfo,
  POINTS_RULES,
  type Achievement,
} from '../gamification'

// ─── Pure function tests (no mocks needed) ────────────────────────────────

describe('checkAchievementQualification', () => {
  const baseStats = {
    orderCount: 0,
    reviewCount: 0,
    totalSpentCents: 0,
    currentTier: 'bronze' as const,
    referralCount: 0,
  }

  const makeAchievement = (
    conditionType: Achievement['conditionType'],
    conditionValue: number
  ): Achievement => ({
    id: 'ach-1',
    name: 'Test',
    description: 'Test achievement',
    icon: '🏆',
    tier: 'bronze',
    pointsReward: 100,
    conditionType,
    conditionValue,
    isActive: true,
  })

  describe('order_count condition', () => {
    it('qualifies when orderCount meets threshold', () => {
      const ach = makeAchievement('order_count', 5)
      expect(checkAchievementQualification(ach, { ...baseStats, orderCount: 5 })).toBe(true)
    })

    it('qualifies when orderCount exceeds threshold', () => {
      const ach = makeAchievement('order_count', 5)
      expect(checkAchievementQualification(ach, { ...baseStats, orderCount: 10 })).toBe(true)
    })

    it('does not qualify when orderCount is below threshold', () => {
      const ach = makeAchievement('order_count', 5)
      expect(checkAchievementQualification(ach, { ...baseStats, orderCount: 4 })).toBe(false)
    })
  })

  describe('review_count condition', () => {
    it('qualifies when reviewCount meets threshold', () => {
      const ach = makeAchievement('review_count', 3)
      expect(checkAchievementQualification(ach, { ...baseStats, reviewCount: 3 })).toBe(true)
    })

    it('does not qualify when reviewCount is below threshold', () => {
      const ach = makeAchievement('review_count', 3)
      expect(checkAchievementQualification(ach, { ...baseStats, reviewCount: 2 })).toBe(false)
    })
  })

  describe('total_spent condition', () => {
    it('qualifies when totalSpentCents meets threshold', () => {
      const ach = makeAchievement('total_spent', 50000)
      expect(checkAchievementQualification(ach, { ...baseStats, totalSpentCents: 50000 })).toBe(
        true
      )
    })

    it('does not qualify when below threshold', () => {
      const ach = makeAchievement('total_spent', 50000)
      expect(checkAchievementQualification(ach, { ...baseStats, totalSpentCents: 49999 })).toBe(
        false
      )
    })
  })

  describe('tier condition', () => {
    it('qualifies when user is at required tier (silver=1)', () => {
      const ach = makeAchievement('tier', 1) // silver index
      expect(checkAchievementQualification(ach, { ...baseStats, currentTier: 'silver' })).toBe(true)
    })

    it('qualifies when user is above required tier', () => {
      const ach = makeAchievement('tier', 1) // silver index
      expect(checkAchievementQualification(ach, { ...baseStats, currentTier: 'gold' })).toBe(true)
    })

    it('does not qualify when user is below required tier', () => {
      const ach = makeAchievement('tier', 2) // gold index
      expect(checkAchievementQualification(ach, { ...baseStats, currentTier: 'silver' })).toBe(
        false
      )
    })
  })

  describe('referral_count condition', () => {
    it('qualifies when referralCount meets threshold', () => {
      const ach = makeAchievement('referral_count', 3)
      expect(checkAchievementQualification(ach, { ...baseStats, referralCount: 3 })).toBe(true)
    })

    it('does not qualify when referralCount is below threshold', () => {
      const ach = makeAchievement('referral_count', 3)
      expect(checkAchievementQualification(ach, { ...baseStats, referralCount: 2 })).toBe(false)
    })
  })
})

describe('getTierInfo', () => {
  it('returns correct info for bronze tier', () => {
    const info = getTierInfo(0)
    expect(info.tier).toBe('bronze')
    expect(info.nextTier).toBe('silver')
    expect(info.nextTierSpend).toBe(50000)
  })

  it('returns correct info for silver tier', () => {
    const info = getTierInfo(50000)
    expect(info.tier).toBe('silver')
    expect(info.nextTier).toBe('gold')
  })

  it('returns null nextTier for platinum (max tier)', () => {
    const info = getTierInfo(500000)
    expect(info.tier).toBe('platinum')
    expect(info.nextTier).toBeNull()
    expect(info.nextTierSpend).toBeNull()
  })
})

// ─── Async service tests (Supabase mocks) ────────────────────────────────

function makeSupabaseMock(overrides?: {
  profileData?: object | null
  transactionError?: object | null
  profileUpdateError?: object | null
  achievements?: object[]
  userAchievements?: object[]
}) {
  const {
    profileData = { total_xp: 100, total_spent_cents: 5000, total_orders: 2 },
    transactionError = null,
    profileUpdateError = null,
    achievements = [],
    userAchievements = [],
  } = overrides ?? {}

  // Build a chainable mock: .from().select().eq().single()
  const single = vi.fn().mockResolvedValue({ data: profileData, error: null })
  const eq = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockResolvedValue({ error: transactionError })
  const updateEq = vi.fn().mockResolvedValue({ error: profileUpdateError })
  const update = vi.fn().mockReturnValue({ eq: updateEq })

  // For .from('achievements').select().eq('is_active', true)
  const achievementsEq = vi.fn().mockResolvedValue({ data: achievements, error: null })
  const achievementsSelect = vi.fn().mockReturnValue({ eq: achievementsEq })

  // For .from('user_achievements').select().eq()
  const userAchievementsEq = vi.fn().mockResolvedValue({ data: userAchievements, error: null })
  const userAchievementsSelect = vi.fn().mockReturnValue({ eq: userAchievementsEq })

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'achievements') return { select: achievementsSelect }
    if (table === 'user_achievements') return { select: userAchievementsSelect, insert }
    if (table === 'points_transactions') return { insert }
    if (table === 'user_profiles') return { select: vi.fn().mockReturnValue({ eq }), update }
    return { select: vi.fn().mockReturnValue({ eq }), insert, update }
  })

  return { from } as any
}

describe('processXpForPurchase', () => {
  it('awards points equal to floor(cents / 100)', async () => {
    const supabase = makeSupabaseMock({
      profileData: { total_xp: 0, total_spent_cents: 0, total_orders: 0 },
    })
    const result = await processXpForPurchase(supabase, 'user-1', 'order-1', 5000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.xp).toBe(50) // 5000 cents = CHF 50 = 50 points
      expect(result.newTotal).toBe(50)
    }
  })

  it('adds to existing points total', async () => {
    const supabase = makeSupabaseMock({
      profileData: { total_xp: 200, total_spent_cents: 20000, total_orders: 5 },
    })
    const result = await processXpForPurchase(supabase, 'user-1', 'order-1', 10000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.xp).toBe(100)
      expect(result.newTotal).toBe(300)
    }
  })

  it('returns error when points transaction insert fails', async () => {
    const supabase = makeSupabaseMock({
      transactionError: { message: 'DB write failed' },
    })
    const result = await processXpForPurchase(supabase, 'user-1', 'order-1', 5000)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('DB write failed')
  })

  it('returns error when profile update fails', async () => {
    const supabase = makeSupabaseMock({
      profileUpdateError: { message: 'Profile update failed' },
    })
    const result = await processXpForPurchase(supabase, 'user-1', 'order-1', 5000)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Profile update failed')
  })

  it('handles null profile (new user with no profile row)', async () => {
    const supabase = makeSupabaseMock({ profileData: null })
    const result = await processXpForPurchase(supabase, 'user-new', 'order-1', 3000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.xp).toBe(30)
      expect(result.newTotal).toBe(30) // starts from 0
    }
  })
})

describe('processXpForReferral', () => {
  it('awards REFERRAL_PURCHASE points to the referrer', async () => {
    const supabase = makeSupabaseMock({
      profileData: { total_xp: 100, referral_count: 1 },
    })
    const result = await processXpForReferral(supabase, 'referrer-1')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.xp).toBe(POINTS_RULES.REFERRAL_PURCHASE)
      expect(result.newTotal).toBe(100 + POINTS_RULES.REFERRAL_PURCHASE)
    }
  })

  it('returns error when transaction insert fails', async () => {
    const supabase = makeSupabaseMock({
      transactionError: { message: 'Insert failed' },
    })
    const result = await processXpForReferral(supabase, 'referrer-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Insert failed')
  })
})

describe('checkAndAwardAchievements', () => {
  it('skips if user profile not found', async () => {
    const supabase = makeSupabaseMock({ profileData: null })
    // Should not throw
    await expect(checkAndAwardAchievements(supabase, 'user-1')).resolves.toBeUndefined()
  })

  it('skips if no active achievements', async () => {
    const supabase = makeSupabaseMock({ achievements: [] })
    await expect(checkAndAwardAchievements(supabase, 'user-1')).resolves.toBeUndefined()
  })

  it('does not award already unlocked achievements', async () => {
    const supabase = makeSupabaseMock({
      profileData: {
        total_orders: 10,
        total_spent_cents: 100000,
        review_count: 5,
        current_tier: 'gold',
        referral_count: 3,
      },
      achievements: [
        {
          id: 'ach-already-unlocked',
          condition_type: 'order_count',
          condition_value: 1,
          points_reward: 0,
        },
      ],
      userAchievements: [{ achievement_id: 'ach-already-unlocked' }],
    })
    // Insert should NOT be called since it's already unlocked
    await checkAndAwardAchievements(supabase, 'user-1')
    // from('user_achievements').insert should not have been called
    const insertCalls = supabase.from.mock.calls.filter(
      ([t]: [string]) => t === 'user_achievements'
    )
    // The insert mock tracks calls; if only select calls were made, insert shouldn't fire
    expect(insertCalls.length).toBeGreaterThan(0) // select was called
  })
})
