/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: (fn: (...args: any[]) => any) => fn,
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('lib/queries - extended', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getActiveCategories', () => {
    it('returns categories list', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockCategories = [
        { id: 'cat-1', name: 'Hoodies', slug: 'hoodies', description: null },
        { id: 'cat-2', name: 'T-Shirts', slug: 't-shirts', description: null },
      ]
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            order: () => Promise.resolve({ data: mockCategories }),
          }),
        }),
      } as any)

      const { getActiveCategories } = await import('../queries')
      const result = await getActiveCategories()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Hoodies')
    })

    it('returns empty array when no categories', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            order: () => Promise.resolve({ data: null }),
          }),
        }),
      } as any)

      const { getActiveCategories } = await import('../queries')
      const result = await getActiveCategories()
      expect(result).toEqual([])
    })
  })

  describe('getUserWishlistProductIds', () => {
    it('returns product ids from wishlist', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [{ product_id: 'prod-1' }, { product_id: 'prod-2' }],
              }),
          }),
        }),
      } as any)

      const { getUserWishlistProductIds } = await import('../queries')
      const result = await getUserWishlistProductIds('user-1')
      expect(result).toEqual(['prod-1', 'prod-2'])
    })

    it('returns empty array when wishlist is empty', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => Promise.resolve({ data: null }),
          }),
        }),
      } as any)

      const { getUserWishlistProductIds } = await import('../queries')
      const result = await getUserWishlistProductIds('user-1')
      expect(result).toEqual([])
    })
  })

  describe('getCategoryMetadata', () => {
    it('returns category metadata for valid slug', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { name: 'Hoodies', description: 'Great hoodies' },
                }),
            }),
          }),
        }),
      } as any)

      const { getCategoryMetadata } = await import('../queries')
      const result = await getCategoryMetadata('hoodies')
      expect(result?.name).toBe('Hoodies')
    })

    it('returns null for non-existent slug', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      } as any)

      const { getCategoryMetadata } = await import('../queries')
      const result = await getCategoryMetadata('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getProductMetadata', () => {
    it('returns product metadata for valid slug', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      name: 'Test Hoodie',
                      description: '<p>Nice hoodie</p>',
                      categories: { name: 'Hoodies', slug: 'hoodies' },
                      product_images: [{ url: 'img.jpg', sort_order: 0 }],
                    },
                  }),
              }),
            }),
          }),
        }),
      } as any)

      const { getProductMetadata } = await import('../queries')
      const result = await getProductMetadata('test-hoodie')
      expect(result?.name).toBe('Test Hoodie')
    })

    it('returns null for non-existent slug', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        }),
      } as any)

      const { getProductMetadata } = await import('../queries')
      const result = await getProductMetadata('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getProductCustomizationRule', () => {
    it('returns customization rule when found', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockRule = { rule_def: { maxChars: 20, allowEmoji: false } }
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockRule }),
            }),
          }),
        }),
      } as any)

      const { getProductCustomizationRule } = await import('../queries')
      const result = await getProductCustomizationRule('prod-1')
      expect(result).toEqual(mockRule)
    })

    it('returns null when no customization rule exists', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      } as any)

      const { getProductCustomizationRule } = await import('../queries')
      const result = await getProductCustomizationRule('prod-no-rule')
      expect(result).toBeNull()
    })
  })

  describe('getUserProductReview', () => {
    it('returns null when user has not reviewed the product', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        }),
      } as any)

      const { getUserProductReview } = await import('../queries')
      const result = await getUserProductReview('prod-1', 'user-1')
      expect(result).toBeNull()
    })

    it('returns transformed review when user has reviewed the product', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockReviewRow = {
        id: 'review-1',
        rating: 5,
        comment: 'Amazing!',
        reviewer_display_name: 'Alice',
        order_id: 'order-1',
        created_at: '2026-01-01T00:00:00Z',
        photos: null,
        user_id: 'user-1',
        user_profiles: { avatar_url: 'https://cdn.example.com/avatar.jpg' },
      }
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: mockReviewRow }),
              }),
            }),
          }),
        }),
      } as any)

      const { getUserProductReview } = await import('../queries')
      const result = await getUserProductReview('prod-1', 'user-1')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('review-1')
      expect(result?.rating).toBe(5)
      expect((result as any).avatar_url).toBe('https://cdn.example.com/avatar.jpg')
    })

    it('returns review with null avatar when user_profiles is null', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockReviewRow = {
        id: 'review-2',
        rating: 3,
        comment: null,
        reviewer_display_name: 'Bob',
        order_id: null,
        created_at: '2026-01-02T00:00:00Z',
        photos: null,
        user_id: 'user-2',
        user_profiles: null,
      }
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: mockReviewRow }),
              }),
            }),
          }),
        }),
      } as any)

      const { getUserProductReview } = await import('../queries')
      const result = await getUserProductReview('prod-1', 'user-2')
      expect((result as any).avatar_url).toBeNull()
    })
  })
})
