/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock react cache to be transparent (pass-through) in tests
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: (fn: (...args: any[]) => any) => fn,
  }
})

// Mock supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('getProductReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when there are no reviews', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    } as any)

    const { getProductReviews } = await import('../queries')
    const result = await getProductReviews('product-id-1')
    expect(result).toEqual([])
  })

  it('transforms user_profiles into flat avatar_url', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockReviewData = [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Great product!',
        reviewer_display_name: 'Alice',
        order_id: 'order-1',
        created_at: '2026-01-01T00:00:00Z',
        photos: null,
        user_id: 'user-1',
        user_profiles: { avatar_url: 'https://cdn.example.com/avatar.jpg' },
      },
    ]

    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockReviewData, error: null }),
          }),
        }),
      }),
    } as any)

    const { getProductReviews } = await import('../queries')
    const result = await getProductReviews('product-id-1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('review-1')
    expect(result[0].rating).toBe(5)
    // avatar_url should be flattened out of user_profiles
    expect((result[0] as any).avatar_url).toBe('https://cdn.example.com/avatar.jpg')
    // user_profiles should NOT be present on the result
    expect((result[0] as any).user_profiles).toBeUndefined()
  })

  it('handles null user_profiles gracefully (deleted user)', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockReviewData = [
      {
        id: 'review-2',
        rating: 3,
        comment: 'OK',
        reviewer_display_name: 'Bob',
        order_id: null,
        created_at: '2026-01-02T00:00:00Z',
        photos: null,
        user_id: 'user-2',
        user_profiles: null, // user deleted
      },
    ]

    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockReviewData, error: null }),
          }),
        }),
      }),
    } as any)

    const { getProductReviews } = await import('../queries')
    const result = await getProductReviews('product-id-1')

    expect(result).toHaveLength(1)
    expect((result[0] as any).avatar_url).toBeNull()
  })

  it('returns empty array when reviewsData is null (DB error)', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    } as any)

    const { getProductReviews } = await import('../queries')
    const result = await getProductReviews('product-id-1')
    expect(result).toEqual([])
  })
})

describe('isProductInWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when product is in wishlist', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: 'wishlist-1' }, error: null }),
            }),
          }),
        }),
      }),
    } as any)

    const { isProductInWishlist } = await import('../queries')
    const result = await isProductInWishlist('product-1', 'user-1')
    expect(result).toBe(true)
  })

  it('returns false when product is not in wishlist', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    } as any)

    const { isProductInWishlist } = await import('../queries')
    const result = await isProductInWishlist('product-1', 'user-1')
    expect(result).toBe(false)
  })
})

describe('getProductBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns product data for existing slug', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockProduct = {
      id: 'prod-1',
      name: 'Test Hoodie',
      slug: 'test-hoodie',
      description: '<p>Great hoodie</p>',
      is_customizable: false,
      category_id: 'cat-1',
      story_content: null,
      printful_sync_product_id: 123,
      categories: { name: 'Hoodies', slug: 'hoodies' },
      product_images: [
        {
          url: 'https://cdn.example.com/img.jpg',
          alt: null,
          sort_order: 0,
          color: null,
          variant_id: null,
        },
      ],
      product_variants: [
        {
          id: 'var-1',
          name: 'M / Black',
          price_cents: 4900,
          attributes: { color: 'Black', size: 'M' },
          sort_order: 0,
          printful_sync_variant_id: 1,
          product_inventory: [{ quantity: 10 }],
        },
      ],
    }

    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                single: () => Promise.resolve({ data: mockProduct, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any)

    const { getProductBySlug } = await import('../queries')
    const { data, error } = await getProductBySlug('test-hoodie')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data?.id).toBe('prod-1')
    expect(data?.name).toBe('Test Hoodie')
  })

  it('returns error for non-existent slug', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                single: () =>
                  Promise.resolve({
                    data: null,
                    error: { code: 'PGRST116', message: 'No rows found' },
                  }),
              }),
            }),
          }),
        }),
      }),
    } as any)

    const { getProductBySlug } = await import('../queries')
    const { data, error } = await getProductBySlug('nonexistent-product')
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })
})
