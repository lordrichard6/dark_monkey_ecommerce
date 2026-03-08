import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { awardXpForPurchase, awardXpForReferral, checkProfileCompleteBadge } from '../gamification'

// Mock the gamification lib functions that do the heavy lifting
vi.mock('@/lib/gamification', () => ({
  processXpForPurchase: vi.fn(),
  processXpForReferral: vi.fn(),
  checkAndAwardAchievements: vi.fn(),
}))

// Mock @supabase/supabase-js (used directly in gamification.ts, not the server client)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}))

describe('Gamification Actions', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    // Configure env vars so getAdminSupabase() returns a client
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
  })

  // ── awardXpForPurchase ─────────────────────────────────────────────────────
  describe('awardXpForPurchase', () => {
    it('returns ok: false with "Not configured" when env vars are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const result = await awardXpForPurchase('user-1', 'order-1', 5000)

      expect(result).toEqual({ ok: false, error: 'Not configured' })
    })

    it('delegates to processXpForPurchase and returns its result on success', async () => {
      const { processXpForPurchase } = await import('@/lib/gamification')
      vi.mocked(processXpForPurchase).mockResolvedValue({ ok: true, xp: 50, newTotal: 350 })

      const result = await awardXpForPurchase('user-1', 'order-1', 5000)

      expect(result).toEqual({ ok: true, xp: 50, newTotal: 350 })
      expect(processXpForPurchase).toHaveBeenCalledOnce()
    })

    it('passes userId, orderId, totalCents to processXpForPurchase', async () => {
      const { processXpForPurchase } = await import('@/lib/gamification')
      vi.mocked(processXpForPurchase).mockResolvedValue({ ok: true, xp: 10, newTotal: 100 })

      await awardXpForPurchase('user-abc', 'order-xyz', 12500)

      const [, userId, orderId, totalCents] = vi.mocked(processXpForPurchase).mock.calls[0]
      expect(userId).toBe('user-abc')
      expect(orderId).toBe('order-xyz')
      expect(totalCents).toBe(12500)
    })

    it('propagates error from processXpForPurchase', async () => {
      const { processXpForPurchase } = await import('@/lib/gamification')
      vi.mocked(processXpForPurchase).mockResolvedValue({
        ok: false,
        error: 'XP processing failed',
      })

      const result = await awardXpForPurchase('user-1', 'order-1', 5000)

      expect(result).toEqual({ ok: false, error: 'XP processing failed' })
    })

    it('returns ok: false when only URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const result = await awardXpForPurchase('user-1', 'order-1', 5000)

      expect(result).toEqual({ ok: false, error: 'Not configured' })
    })

    it('returns ok: false when only service role key is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const result = await awardXpForPurchase('user-1', 'order-1', 5000)

      expect(result).toEqual({ ok: false, error: 'Not configured' })
    })
  })

  // ── awardXpForReferral ─────────────────────────────────────────────────────
  describe('awardXpForReferral', () => {
    it('returns ok: false with "Not configured" when env vars are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const result = await awardXpForReferral('referrer-1')

      expect(result).toEqual({ ok: false, error: 'Not configured' })
    })

    it('delegates to processXpForReferral and returns its result', async () => {
      const { processXpForReferral } = await import('@/lib/gamification')
      vi.mocked(processXpForReferral).mockResolvedValue({ ok: true, xp: 200, newTotal: 700 })

      const result = await awardXpForReferral('referrer-1')

      expect(result).toEqual({ ok: true, xp: 200, newTotal: 700 })
      expect(processXpForReferral).toHaveBeenCalledOnce()
    })

    it('passes referrerId to processXpForReferral', async () => {
      const { processXpForReferral } = await import('@/lib/gamification')
      vi.mocked(processXpForReferral).mockResolvedValue({ ok: true, xp: 200, newTotal: 700 })

      await awardXpForReferral('referrer-abc')

      const [, referrerId] = vi.mocked(processXpForReferral).mock.calls[0]
      expect(referrerId).toBe('referrer-abc')
    })

    it('propagates error from processXpForReferral', async () => {
      const { processXpForReferral } = await import('@/lib/gamification')
      vi.mocked(processXpForReferral).mockResolvedValue({ ok: false, error: 'Referral error' })

      const result = await awardXpForReferral('referrer-1')

      expect(result).toEqual({ ok: false, error: 'Referral error' })
    })
  })

  // ── checkProfileCompleteBadge ──────────────────────────────────────────────
  describe('checkProfileCompleteBadge', () => {
    it('returns without error when env vars are missing (graceful no-op)', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Should not throw
      await expect(checkProfileCompleteBadge('user-1')).resolves.toBeUndefined()
    })

    it('delegates to checkAndAwardAchievements when configured', async () => {
      const { checkAndAwardAchievements } = await import('@/lib/gamification')
      vi.mocked(checkAndAwardAchievements).mockResolvedValue(undefined)

      await checkProfileCompleteBadge('user-1')

      expect(checkAndAwardAchievements).toHaveBeenCalledOnce()
    })

    it('passes userId to checkAndAwardAchievements', async () => {
      const { checkAndAwardAchievements } = await import('@/lib/gamification')
      vi.mocked(checkAndAwardAchievements).mockResolvedValue(undefined)

      await checkProfileCompleteBadge('user-xyz')

      const [, userId] = vi.mocked(checkAndAwardAchievements).mock.calls[0]
      expect(userId).toBe('user-xyz')
    })

    it('returns void regardless of outcome', async () => {
      const { checkAndAwardAchievements } = await import('@/lib/gamification')
      vi.mocked(checkAndAwardAchievements).mockResolvedValue(undefined)

      const result = await checkProfileCompleteBadge('user-1')

      expect(result).toBeUndefined()
    })
  })
})
