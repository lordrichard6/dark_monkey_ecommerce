import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addToCart, updateCartItem, removeFromCart } from '../cart'

// Mock Next.js modules
vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => []),
    })),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock cart utilities
vi.mock('@/lib/cart', () => ({
    getCart: vi.fn(() => Promise.resolve({ items: [] })),
    serializeCart: vi.fn((cart) => JSON.stringify(cart)),
    getCartCookieConfig: vi.fn(() => ({
        name: 'cart',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax' as const,
        secure: true,
    })),
}))

describe('Cart Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('addToCart', () => {
        it('should add a new item to empty cart', async () => {
            const { getCart } = await import('@/lib/cart')
            const { cookies } = await import('next/headers')

            vi.mocked(getCart).mockResolvedValue({ items: [] })
            const mockSet = vi.fn()
            vi.mocked(cookies).mockReturnValue({
                set: mockSet,
                get: vi.fn(),
                delete: vi.fn(),
                getAll: vi.fn(() => []),
            } as any)

            await addToCart({
                variantId: 'variant-1',
                productId: 'product-1',
                productSlug: 'test-product',
                productName: 'Test Product',
                variantName: 'Default',
                priceCents: 2999,
                imageUrl: '/test.jpg',
            })

            expect(mockSet).toHaveBeenCalled()
            const cartData = JSON.parse(mockSet.mock.calls[0][1])
            expect(cartData.items).toHaveLength(1)
            expect(cartData.items[0].variantId).toBe('variant-1')
            expect(cartData.items[0].quantity).toBe(1)
        })

        it('should increment quantity for existing item', async () => {
            const { getCart } = await import('@/lib/cart')
            const { cookies } = await import('next/headers')

            vi.mocked(getCart).mockResolvedValue({
                items: [
                    {
                        variantId: 'variant-1',
                        productId: 'product-1',
                        productSlug: 'test-product',
                        productName: 'Test Product',
                        variantName: 'Default',
                        priceCents: 2999,
                        quantity: 1,
                        imageUrl: '/test.jpg',
                    },
                ],
            })

            const mockSet = vi.fn()
            vi.mocked(cookies).mockReturnValue({
                set: mockSet,
                get: vi.fn(),
                delete: vi.fn(),
                getAll: vi.fn(() => []),
            } as any)

            await addToCart({
                variantId: 'variant-1',
                productId: 'product-1',
                productSlug: 'test-product',
                productName: 'Test Product',
                variantName: 'Default',
                priceCents: 2999,
                imageUrl: '/test.jpg',
            })

            const cartData = JSON.parse(mockSet.mock.calls[0][1])
            expect(cartData.items[0].quantity).toBe(2)
        })

        it('should handle items with custom config separately', async () => {
            const { getCart } = await import('@/lib/cart')
            const { cookies } = await import('next/headers')

            vi.mocked(getCart).mockResolvedValue({
                items: [
                    {
                        variantId: 'variant-1',
                        productId: 'product-1',
                        productSlug: 'test-product',
                        productName: 'Test Product',
                        variantName: 'Default',
                        priceCents: 2999,
                        quantity: 1,
                        imageUrl: '/test.jpg',
                        config: { color: 'red' },
                    },
                ],
            })

            const mockSet = vi.fn()
            vi.mocked(cookies).mockReturnValue({
                set: mockSet,
                get: vi.fn(),
                delete: vi.fn(),
                getAll: vi.fn(() => []),
            } as any)

            // Add same variant but different config
            await addToCart({
                variantId: 'variant-1',
                productId: 'product-1',
                productSlug: 'test-product',
                productName: 'Test Product',
                variantName: 'Default',
                priceCents: 2999,
                imageUrl: '/test.jpg',
                config: { color: 'blue' },
            })

            const cartData = JSON.parse(mockSet.mock.calls[0][1])
            expect(cartData.items).toHaveLength(2)
        })
    })

    describe('updateCartItem', () => {
        it('should update item quantity', async () => {
            const { getCart } = await import('@/lib/cart')
            const { cookies } = await import('next/headers')

            vi.mocked(getCart).mockResolvedValue({
                items: [
                    {
                        variantId: 'variant-1',
                        productId: 'product-1',
                        productSlug: 'test-product',
                        productName: 'Test Product',
                        variantName: 'Default',
                        priceCents: 2999,
                        quantity: 1,
                        imageUrl: '/test.jpg',
                    },
                ],
            })

            const mockSet = vi.fn()
            vi.mocked(cookies).mockReturnValue({
                set: mockSet,
                get: vi.fn(),
                delete: vi.fn(),
                getAll: vi.fn(() => []),
            } as any)

            await updateCartItem('variant-1', 5)

            const cartData = JSON.parse(mockSet.mock.calls[0][1])
            expect(cartData.items[0].quantity).toBe(5)
        })

        it('should remove item when quantity is 0', async () => {
            const { getCart } = await import('@/lib/cart')
            const { cookies } = await import('next/headers')

            vi.mocked(getCart).mockResolvedValue({
                items: [
                    {
                        variantId: 'variant-1',
                        productId: 'product-1',
                        productSlug: 'test-product',
                        productName: 'Test Product',
                        variantName: 'Default',
                        priceCents: 2999,
                        quantity: 1,
                        imageUrl: '/test.jpg',
                    },
                ],
            })

            const mockSet = vi.fn()
            vi.mocked(cookies).mockReturnValue({
                set: mockSet,
                get: vi.fn(),
                delete: vi.fn(),
                getAll: vi.fn(() => []),
            } as any)

            await updateCartItem('variant-1', 0)

            const cartData = JSON.parse(mockSet.mock.calls[0][1])
            expect(cartData.items).toHaveLength(0)
        })
    })

    describe('removeFromCart', () => {
        it('should remove item from cart', async () => {
            const { getCart } = await import('@/lib/cart')
            const { cookies } = await import('next/headers')

            vi.mocked(getCart).mockResolvedValue({
                items: [
                    {
                        variantId: 'variant-1',
                        productId: 'product-1',
                        productSlug: 'test-product',
                        productName: 'Test Product',
                        variantName: 'Default',
                        priceCents: 2999,
                        quantity: 2,
                        imageUrl: '/test.jpg',
                    },
                ],
            })

            const mockSet = vi.fn()
            vi.mocked(cookies).mockReturnValue({
                set: mockSet,
                get: vi.fn(),
                delete: vi.fn(),
                getAll: vi.fn(() => []),
            } as any)

            await removeFromCart('variant-1')

            const cartData = JSON.parse(mockSet.mock.calls[0][1])
            expect(cartData.items).toHaveLength(0)
        })
    })
})
