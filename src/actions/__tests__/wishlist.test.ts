import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addToWishlist, removeFromWishlist, toggleWishlist, setWishlistPublic } from '../wishlist'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

type TerminalResult = { error: { message: string } | null; data?: unknown }

/** Creates a chainable Supabase query builder mock. */
function makeQueryBuilder(terminalResult: TerminalResult) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue(terminalResult),
    insert: vi.fn().mockResolvedValue(terminalResult),
    single: vi.fn().mockResolvedValue(terminalResult),
    then: (resolve: (v: TerminalResult) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(terminalResult).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(terminalResult).catch(reject),
  }
  return builder
}

function makeSupabase(
  user: { id: string; email: string } | null,
  queryResult: TerminalResult = { error: null }
) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(makeQueryBuilder(queryResult)),
  }
}

describe('Wishlist Actions', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── addToWishlist ──────────────────────────────────────────────────────────
  describe('addToWishlist', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await addToWishlist('product-1')
      expect(result).toEqual({ ok: false, error: 'Sign in to save items' })
    })

    it('returns ok: true on success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await addToWishlist('product-1')
      expect(result).toEqual({ ok: true })
    })

    it('returns error when DB upsert fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'DB error' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await addToWishlist('product-1')
      expect(result).toEqual({ ok: false, error: 'DB error' })
    })

    it('upserts into user_wishlist table with correct conflict target', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase(mockUser)
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await addToWishlist('product-abc')

      expect(supabase.from).toHaveBeenCalledWith('user_wishlist')
      const builder = supabase.from.mock.results[0].value
      expect(builder.upsert).toHaveBeenCalledWith(
        { user_id: mockUser.id, product_id: 'product-abc' },
        { onConflict: 'user_id,product_id' }
      )
    })

    it('calls revalidatePath after success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await addToWishlist('product-1')

      expect(revalidatePath).toHaveBeenCalledWith('/account/wishlist', 'page')
    })
  })

  // ── removeFromWishlist ─────────────────────────────────────────────────────
  describe('removeFromWishlist', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await removeFromWishlist('product-1')
      expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    })

    it('returns ok: true on success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await removeFromWishlist('product-1')
      expect(result).toEqual({ ok: true })
    })

    it('returns error when DB delete fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'Delete failed' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await removeFromWishlist('product-1')
      expect(result).toEqual({ ok: false, error: 'Delete failed' })
    })

    it('deletes from user_wishlist with correct user and product filters', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase(mockUser)
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await removeFromWishlist('product-xyz')

      expect(supabase.from).toHaveBeenCalledWith('user_wishlist')
      const builder = supabase.from.mock.results[0].value
      expect(builder.delete).toHaveBeenCalled()
      expect(builder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(builder.eq).toHaveBeenCalledWith('product_id', 'product-xyz')
    })
  })

  // ── toggleWishlist ─────────────────────────────────────────────────────────
  describe('toggleWishlist', () => {
    it('removes item when isInWishlist is true and returns inWishlist: false', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await toggleWishlist('product-1', true)
      expect(result).toEqual({ ok: true, inWishlist: false })
    })

    it('adds item when isInWishlist is false and returns inWishlist: true', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await toggleWishlist('product-1', false)
      expect(result).toEqual({ ok: true, inWishlist: true })
    })

    it('propagates auth error from addToWishlist', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await toggleWishlist('product-1', false)
      expect(result).toEqual({ ok: false, error: 'Sign in to save items' })
    })

    it('propagates auth error from removeFromWishlist', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await toggleWishlist('product-1', true)
      expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    })
  })

  // ── setWishlistPublic ──────────────────────────────────────────────────────
  describe('setWishlistPublic', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await setWishlistPublic(true)
      expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    })

    it('returns ok: true when visibility set to public', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await setWishlistPublic(true)
      expect(result).toEqual({ ok: true })
    })

    it('returns ok: true when visibility set to private', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await setWishlistPublic(false)
      expect(result).toEqual({ ok: true })
    })

    it('returns error when DB update fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'Update failed' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await setWishlistPublic(true)
      expect(result).toEqual({ ok: false, error: 'Update failed' })
    })

    it('updates user_profiles with is_public value', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase(mockUser)
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await setWishlistPublic(false)

      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
      const builder = supabase.from.mock.results[0].value
      expect(builder.update).toHaveBeenCalledWith({ is_public: false })
    })
  })
})
