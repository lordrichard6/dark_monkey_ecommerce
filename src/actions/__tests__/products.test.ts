import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProductQuickView } from '../products'
import type { getProductBySlug, getProductCustomizationRule } from '@/lib/queries'

vi.mock('@/lib/queries', () => ({
  getProductBySlug: vi.fn(),
  getProductCustomizationRule: vi.fn(),
}))

type ProductBySlugResult = Awaited<ReturnType<typeof getProductBySlug>>
type CustomizationRuleResult = Awaited<ReturnType<typeof getProductCustomizationRule>>

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A great product',
  is_customizable: false,
  product_images: [{ url: '/img.jpg', alt: null, sort_order: 0 }],
  product_variants: [
    {
      id: 'v1',
      name: 'Default',
      price_cents: 2999,
      attributes: {},
      sort_order: 0,
      product_inventory: null,
    },
  ],
  categories: { name: 'Accessories' },
}

describe('Products Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProductQuickView', () => {
    it('returns error when product not found', async () => {
      const { getProductBySlug } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: null,
        error: 'Not found',
      } as unknown as ProductBySlugResult)

      const result = await getProductQuickView('unknown-slug')

      expect(result).toEqual({ error: 'Product not found' })
    })

    it('returns error when DB returns an error', async () => {
      const { getProductBySlug } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: null,
        error: 'DB error',
      } as unknown as ProductBySlugResult)

      const result = await getProductQuickView('any-slug')

      expect(result).toEqual({ error: 'Product not found' })
    })

    it('returns product data for a valid slug', async () => {
      const { getProductBySlug } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: mockProduct,
        error: null,
      } as unknown as ProductBySlugResult)

      const result = await getProductQuickView('test-product')

      expect(result).toMatchObject({
        data: expect.objectContaining({ id: 'product-1', slug: 'test-product' }),
      })
    })

    it('returns null customizationRule for non-customizable products', async () => {
      const { getProductBySlug, getProductCustomizationRule } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: { ...mockProduct, is_customizable: false },
        error: null,
      } as unknown as ProductBySlugResult)

      const result = await getProductQuickView('test-product')

      expect(result).toMatchObject({ customizationRule: null })
      expect(getProductCustomizationRule).not.toHaveBeenCalled()
    })

    it('fetches customization rule for customizable products', async () => {
      const { getProductBySlug, getProductCustomizationRule } = await import('@/lib/queries')
      const mockRule = { rule_def: { type: 'text', label: 'Engraving' } }
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: { ...mockProduct, is_customizable: true },
        error: null,
      } as unknown as ProductBySlugResult)
      vi.mocked(getProductCustomizationRule).mockResolvedValue(
        mockRule as unknown as CustomizationRuleResult
      )

      const result = await getProductQuickView('custom-product')

      expect(getProductCustomizationRule).toHaveBeenCalledWith('product-1')
      expect(result).toMatchObject({ customizationRule: mockRule })
    })

    it('returns null customizationRule when rule fetch returns null', async () => {
      const { getProductBySlug, getProductCustomizationRule } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: { ...mockProduct, is_customizable: true },
        error: null,
      } as unknown as ProductBySlugResult)
      vi.mocked(getProductCustomizationRule).mockResolvedValue(null)

      const result = await getProductQuickView('custom-product')

      expect(result).toMatchObject({ customizationRule: null })
    })

    it('calls getProductBySlug with the provided slug', async () => {
      const { getProductBySlug } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: mockProduct,
        error: null,
      } as unknown as ProductBySlugResult)

      await getProductQuickView('specific-slug')

      expect(getProductBySlug).toHaveBeenCalledWith('specific-slug')
    })

    it('includes product images in the returned data', async () => {
      const { getProductBySlug } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: mockProduct,
        error: null,
      } as unknown as ProductBySlugResult)

      const result = await getProductQuickView('test-product')

      expect(result).toMatchObject({
        data: expect.objectContaining({
          product_images: expect.arrayContaining([expect.objectContaining({ url: '/img.jpg' })]),
        }),
      })
    })

    it('includes product variants in the returned data', async () => {
      const { getProductBySlug } = await import('@/lib/queries')
      vi.mocked(getProductBySlug).mockResolvedValue({
        data: mockProduct,
        error: null,
      } as unknown as ProductBySlugResult)

      const result = await getProductQuickView('test-product')

      expect(result).toMatchObject({
        data: expect.objectContaining({
          product_variants: expect.arrayContaining([expect.objectContaining({ id: 'v1' })]),
        }),
      })
    })
  })
})
