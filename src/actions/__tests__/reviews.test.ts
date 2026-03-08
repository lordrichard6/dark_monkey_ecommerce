import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitReview } from '../reviews'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockUser = { id: 'user-1', email: 'test@example.com' }

type TerminalResult = { error: { message: string } | null; data?: unknown }

/** Chainable query builder where the entire chain is awaitable. */
function makeBuilder(terminalResult: TerminalResult, singleResult?: TerminalResult) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue(terminalResult),
    insert: vi.fn().mockResolvedValue(terminalResult),
    single: vi.fn().mockResolvedValue(singleResult ?? terminalResult),
    then: (resolve: (v: TerminalResult) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(terminalResult).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(terminalResult).catch(reject),
  }
  return builder
}

function makeSupabase(options: {
  user?: typeof mockUser | null
  orderResult?: unknown
  orderItemsResult?: unknown[]
  profileResult?: unknown
  upsertError?: { message: string } | null
}) {
  const user = options.user ?? null
  const upsertResult: TerminalResult = { error: options.upsertError ?? null }

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'orders') {
        // The action destructures `{ data: order }` from `.single()` — result must have `data` key
        const orderData = options.orderResult ?? null
        return makeBuilder(
          { data: orderData, error: null }, // terminalResult (for awaitable chain)
          { data: orderData, error: null } // singleResult (for .single())
        )
      }
      if (table === 'order_items') {
        const items = options.orderItemsResult ?? []
        // action: `const { data: items } = await ...select().eq()` — uses awaitable chain
        return makeBuilder({ data: items, error: null })
      }
      if (table === 'user_profiles') {
        const profile = options.profileResult ?? { display_name: 'Test User' }
        // action: `const { data: profile } = await ...select().eq().single()`
        return makeBuilder(
          { data: profile, error: null }, // terminalResult
          { data: profile, error: null } // singleResult
        )
      }
      // product_reviews — uses .upsert()
      return makeBuilder(upsertResult)
    }),
  }
}

describe('Reviews Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitReview', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: null }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 4, 'Great product')

      expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    })

    it('returns error when rating is below 1', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 0, 'Great product')

      expect(result).toEqual({ ok: false, error: 'Rating must be between 1 and 5' })
    })

    it('returns error when rating exceeds 5', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 6, 'Great product')

      expect(result).toEqual({ ok: false, error: 'Rating must be between 1 and 5' })
    })

    it('returns ok: true on successful submission without orderId', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 5, 'Excellent!')

      expect(result).toEqual({ ok: true })
    })

    it('returns ok: true for all valid ratings (1-5)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      for (const rating of [1, 2, 3, 4, 5]) {
        vi.clearAllMocks()
        vi.mocked(createClient).mockResolvedValue(
          makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
        )
        const result = await submitReview('product-1', rating, 'Good')
        expect(result).toEqual({ ok: true })
      }
    })

    it('returns error when DB upsert fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({
          user: mockUser,
          upsertError: { message: 'DB write failed' },
        }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 4, 'Good product')

      expect(result).toEqual({ ok: false, error: 'DB write failed' })
    })

    it('returns error when orderId provided but order not found', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser, orderResult: null }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await submitReview('product-1', 4, 'Good', 'order-missing')

      expect(result).toEqual({ ok: false, error: 'Order not found' })
    })

    it('submits as verified purchase when orderId is valid and product matches', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({
          user: mockUser,
          orderResult: { id: 'order-1' },
          orderItemsResult: [{ product_variants: [{ product_id: 'product-1' }] }],
        }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 5, 'Verified!', 'order-1')

      expect(result).toEqual({ ok: true })
    })

    it('calls revalidatePath for product slug when provided', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await submitReview('product-1', 4, 'Great', undefined, 'my-product-slug')

      expect(revalidatePath).toHaveBeenCalledWith('/products/my-product-slug')
    })

    it('always calls revalidatePath for /account/orders', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await submitReview('product-1', 4, 'Great')

      expect(revalidatePath).toHaveBeenCalledWith('/account/orders')
    })

    it('upserts into product_reviews with correct conflict target', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase({ user: mockUser })
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await submitReview('product-1', 4, 'Nice!')

      // product_reviews upsert is the last from() call
      expect(supabase.from).toHaveBeenCalledWith('product_reviews')
    })

    it('includes photos array in upsert payload', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ user: mockUser }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await submitReview('product-1', 5, 'With photos', undefined, undefined, [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ])

      expect(result).toEqual({ ok: true })
    })
  })
})
