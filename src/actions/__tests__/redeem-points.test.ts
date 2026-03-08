import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redeemPoints } from '../redeem-points'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the gamification constants
vi.mock('@/lib/gamification', () => ({
  POINTS_REDEMPTION: {
    100: 500, // 100 points → 5 CHF (500 cents)
    250: 1500, // 250 points → 15 CHF
    500: 3500, // 500 points → 35 CHF
  },
}))

// Note: crypto is a built-in Node module; we test the code format via .toMatch()
// rather than mocking randomBytes directly.

const mockUser = { id: 'user-1', email: 'test@example.com' }

type TerminalResult = { error: { message: string } | null; data?: unknown }

function makeQueryBuilder(terminalResult: TerminalResult) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue(terminalResult),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(terminalResult),
    then: (resolve: (v: TerminalResult) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(terminalResult).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(terminalResult).catch(reject),
  }
  return builder
}

function makeSupabase(options: {
  user?: typeof mockUser | null
  profileResult?: { total_xp: number } | null
  txError?: { message: string } | null
  profileUpdateError?: { message: string } | null
  discountError?: { message: string } | null
}) {
  const user = options.user ?? null
  let callCount = 0

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        // First call: select (get profile); subsequent calls: update
        callCount++
        if (callCount === 1) {
          // Use undefined check so that explicit null propagates (null ?? x = x, but null !== undefined)
          const profileData =
            options.profileResult !== undefined ? options.profileResult : { total_xp: 500 }
          return makeQueryBuilder({ data: profileData, error: null })
        }
        return makeQueryBuilder({ error: options.profileUpdateError ?? null })
      }
      if (table === 'points_transactions') {
        return makeQueryBuilder({ error: options.txError ?? null })
      }
      if (table === 'discounts') {
        return makeQueryBuilder({ error: options.discountError ?? null })
      }
      return makeQueryBuilder({ error: null })
    }),
  }
}

describe('Redeem Points Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('redeemPoints', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: null }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await redeemPoints(100)
      expect(result).toEqual({ ok: false, error: 'Unauthorized' })
    })

    it('returns error for invalid redemption amount (not in POINTS_REDEMPTION)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await redeemPoints(999) // not a valid tier
      expect(result).toEqual({ ok: false, error: 'Invalid redemption amount' })
    })

    it('returns error when user has insufficient points', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser, profileResult: { total_xp: 50 } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await redeemPoints(100) // user has 50, needs 100
      expect(result).toEqual({ ok: false, error: 'Insufficient points' })
    })

    it('returns error when user profile not found', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser, profileResult: null }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await redeemPoints(100)
      expect(result).toEqual({ ok: false, error: 'Insufficient points' })
    })

    it('returns ok: true with generated code on successful redemption', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser, profileResult: { total_xp: 500 } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await redeemPoints(100)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.code).toMatch(/^REWARD-/)
      }
    })

    it('returns error when points_transactions insert fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({
          user: mockUser,
          profileResult: { total_xp: 500 },
          txError: { message: 'Transaction failed' },
        }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await redeemPoints(100)
      expect(result).toEqual({ ok: false, error: 'Failed to process redemption transaction' })
    })

    it('returns error when profile XP update fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({
          user: mockUser,
          profileResult: { total_xp: 500 },
          profileUpdateError: { message: 'Profile update failed' },
        }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await redeemPoints(100)
      expect(result).toEqual({ ok: false, error: 'Failed to update point balance' })
    })

    it('returns error when discount creation fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({
          user: mockUser,
          profileResult: { total_xp: 500 },
          discountError: { message: 'Discount creation failed' },
        }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await redeemPoints(100)
      expect(result).toEqual({ ok: false, error: 'Failed to generate discount code' })
    })

    it('calls revalidatePath("/account") on success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser, profileResult: { total_xp: 500 } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      await redeemPoints(100)
      expect(revalidatePath).toHaveBeenCalledWith('/account')
    })

    it('accepts all valid redemption tiers from POINTS_REDEMPTION', async () => {
      for (const points of [100, 250, 500]) {
        vi.clearAllMocks()
        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockResolvedValue(
          makeSupabase({ user: mockUser, profileResult: { total_xp: 1000 } }) as unknown as Awaited<
            ReturnType<typeof createClient>
          >
        )

        const result = await redeemPoints(points)
        expect(result.ok).toBe(true)
      }
    })
  })
})
