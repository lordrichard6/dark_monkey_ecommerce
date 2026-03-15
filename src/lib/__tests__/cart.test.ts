/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

describe('lib/cart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('getCart', () => {
    it('returns empty cart when no cookie exists', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any)

      const { getCart } = await import('../cart')
      const result = await getCart()
      expect(result).toEqual({ items: [] })
    })

    it('returns cart from a valid cookie', async () => {
      const { cookies } = await import('next/headers')
      const cart = { items: [{ variantId: 'v-1', quantity: 2, price: 1999 }] }
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: JSON.stringify(cart) }),
      } as any)

      const { getCart } = await import('../cart')
      const result = await getCart()
      expect(result).toEqual(cart)
    })

    it('returns empty cart when cookie contains invalid JSON', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'not-valid-json{{' }),
      } as any)

      const { getCart } = await import('../cart')
      const result = await getCart()
      expect(result).toEqual({ items: [] })
    })

    it('returns empty cart when parsed value has no items array', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: JSON.stringify({ items: 'not-an-array' }) }),
      } as any)

      const { getCart } = await import('../cart')
      const result = await getCart()
      expect(result).toEqual({ items: [] })
    })

    it('returns empty cart when parsed value is null', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'null' }),
      } as any)

      const { getCart } = await import('../cart')
      const result = await getCart()
      expect(result).toEqual({ items: [] })
    })

    it('returns cart with empty items array', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: JSON.stringify({ items: [] }) }),
      } as any)

      const { getCart } = await import('../cart')
      const result = await getCart()
      expect(result).toEqual({ items: [] })
    })
  })

  describe('serializeCart', () => {
    it('serializes cart to JSON string', async () => {
      const { serializeCart } = await import('../cart')
      const cart = { items: [{ variantId: 'v-1', quantity: 1, price: 999 }] }
      const result = serializeCart(cart as any)
      expect(result).toBe(JSON.stringify(cart))
    })

    it('serializes empty cart', async () => {
      const { serializeCart } = await import('../cart')
      const result = serializeCart({ items: [] })
      expect(result).toBe('{"items":[]}')
    })
  })

  describe('getCartCookieConfig', () => {
    it('returns correct cookie configuration', async () => {
      const { getCartCookieConfig } = await import('../cart')
      const config = getCartCookieConfig()

      expect(config.name).toBe('cart')
      expect(config.maxAge).toBe(60 * 60 * 24 * 7)
      expect(config.path).toBe('/')
      expect(config.sameSite).toBe('lax')
      expect(config.httpOnly).toBe(true)
      // secure is based on NODE_ENV
      expect(typeof config.secure).toBe('boolean')
    })

    it('has correct maxAge of 7 days in seconds', async () => {
      const { getCartCookieConfig } = await import('../cart')
      const config = getCartCookieConfig()
      expect(config.maxAge).toBe(604800) // 7 * 24 * 60 * 60
    })

    it('is httpOnly to prevent client-side access', async () => {
      const { getCartCookieConfig } = await import('../cart')
      const config = getCartCookieConfig()
      expect(config.httpOnly).toBe(true)
    })
  })
})
