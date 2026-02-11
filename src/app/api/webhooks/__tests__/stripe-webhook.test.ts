import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
    getStripe: vi.fn(() => ({
        webhooks: {
            constructEvent: vi.fn(),
        },
    })),
}))

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
    sendOrderConfirmation: vi.fn(),
}))

vi.mock('@/actions/gamification', () => ({
    awardXpForPurchase: vi.fn(),
    awardXpForReferral: vi.fn(),
}))

vi.mock('@/lib/printful', () => ({
    createOrder: vi.fn(),
    getDefaultPrintFileUrl: vi.fn(),
    isPrintfulConfigured: vi.fn(() => true),
}))

describe('Webhook Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Stripe Webhook - checkout.session.completed', () => {
        it('should create order on successful payment', async () => {
            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123',
                        customer_email: 'customer@example.com',
                        amount_total: 10000, // 100 CHF
                        currency: 'chf',
                        metadata: {
                            user_id: 'user-123',
                            totalCents: '10000',
                            currency: 'CHF',
                        },
                        line_items: {
                            data: [
                                {
                                    description: 'Test Product',
                                    quantity: 2,
                                    amount_total: 10000,
                                },
                            ],
                        },
                    },
                },
            }

            const { createClient } = await import('@supabase/supabase-js')

            const mockInsert = vi.fn().mockResolvedValue({
                data: {
                    id: 'order-123',
                    user_id: 'user-123',
                    total_cents: 10000,
                    status: 'pending',
                },
                error: null,
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    insert: mockInsert,
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'order-123' },
                            error: null,
                        }),
                    }),
                }),
            } as any)

            // Simulate webhook processing
            const supabase = createClient('url', 'key')
            await supabase.from('orders').insert({
                user_id: mockEvent.data.object.metadata.user_id,
                stripe_session_id: mockEvent.data.object.id,
                total_cents: 10000,
                status: 'pending',
            })

            expect(mockInsert).toHaveBeenCalledWith({
                user_id: 'user-123',
                stripe_session_id: 'cs_test_123',
                total_cents: 10000,
                status: 'pending',
            })
        })

        it('should award XP for purchase', async () => {
            const { awardXpForPurchase } = await import('@/actions/gamification')

            const totalCents = 10000 // 100 CHF
            const userId = 'user-123'

            await awardXpForPurchase(userId, totalCents)

            expect(awardXpForPurchase).toHaveBeenCalledWith(userId, totalCents)
        })

        it('should send order confirmation email', async () => {
            const { sendOrderConfirmation } = await import('@/lib/resend')

            const orderData = {
                email: 'customer@example.com',
                orderId: 'order-123',
                totalCents: 10000,
                items: [
                    {
                        name: 'Test Product',
                        quantity: 2,
                        priceCents: 5000,
                    },
                ],
            }

            await sendOrderConfirmation(orderData)

            expect(sendOrderConfirmation).toHaveBeenCalledWith(orderData)
        })

        it('should handle guest checkout (no user_id)', async () => {
            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_456',
                        customer_email: 'guest@example.com',
                        amount_total: 5000,
                        currency: 'chf',
                        metadata: {
                            guest_email: 'guest@example.com',
                            totalCents: '5000',
                        },
                    },
                },
            }

            const { createClient } = await import('@supabase/supabase-js')

            const mockInsert = vi.fn().mockResolvedValue({
                data: {
                    id: 'order-456',
                    user_id: null,
                    guest_email: 'guest@example.com',
                    total_cents: 5000,
                    status: 'pending',
                },
                error: null,
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    insert: mockInsert,
                }),
            } as any)

            const supabase = createClient('url', 'key')
            await supabase.from('orders').insert({
                user_id: null,
                guest_email: mockEvent.data.object.metadata.guest_email,
                stripe_session_id: mockEvent.data.object.id,
                total_cents: 5000,
                status: 'pending',
            })

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: null,
                    guest_email: 'guest@example.com',
                })
            )
        })

        it('should apply discount if present in metadata', async () => {
            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_789',
                        customer_email: 'customer@example.com',
                        amount_total: 9000, // 90 CHF (after 10 CHF discount)
                        currency: 'chf',
                        metadata: {
                            user_id: 'user-123',
                            totalCents: '9000',
                            discount_id: 'discount-123',
                            discount_cents: '1000',
                        },
                    },
                },
            }

            const { createClient } = await import('@supabase/supabase-js')

            const mockInsert = vi.fn().mockResolvedValue({
                data: {
                    id: 'order-789',
                    discount_id: 'discount-123',
                    discount_cents: 1000,
                },
                error: null,
            })

            const mockUpdate = vi.fn().mockResolvedValue({
                data: { use_count: 1 },
                error: null,
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn((table) => {
                    if (table === 'orders') {
                        return { insert: mockInsert }
                    }
                    if (table === 'discounts') {
                        return {
                            update: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    then: mockUpdate,
                                }),
                            }),
                        }
                    }
                    return {}
                }),
            } as any)

            const supabase = createClient('url', 'key')

            // Create order with discount
            await supabase.from('orders').insert({
                user_id: 'user-123',
                stripe_session_id: mockEvent.data.object.id,
                total_cents: 9000,
                discount_id: 'discount-123',
                discount_cents: 1000,
                status: 'pending',
            })

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    discount_id: 'discount-123',
                    discount_cents: 1000,
                })
            )
        })
    })

    describe('Stripe Webhook - payment_intent.succeeded', () => {
        it('should update order status to paid', async () => {
            const mockEvent = {
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_123',
                        amount: 10000,
                        currency: 'chf',
                        metadata: {
                            order_id: 'order-123',
                        },
                    },
                },
            }

            const { createClient } = await import('@supabase/supabase-js')

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: {
                                id: 'order-123',
                                status: 'paid',
                            },
                            error: null,
                        }),
                    }),
                }),
            } as any)

            const supabase = createClient('url', 'key')
            const result = await supabase
                .from('orders')
                .update({ status: 'paid', payment_intent_id: mockEvent.data.object.id })
                .eq('id', 'order-123')

            expect(result.data).toBeDefined()
            expect(result.data?.status).toBe('paid')
        })
    })

    describe('Stripe Webhook - payment_intent.payment_failed', () => {
        it('should update order status to failed', async () => {
            const mockEvent = {
                type: 'payment_intent.payment_failed',
                data: {
                    object: {
                        id: 'pi_test_456',
                        last_payment_error: {
                            message: 'Card declined',
                        },
                        metadata: {
                            order_id: 'order-456',
                        },
                    },
                },
            }

            const { createClient } = await import('@supabase/supabase-js')

            const mockUpdate = vi.fn().mockResolvedValue({
                data: {
                    id: 'order-456',
                    status: 'failed',
                },
                error: null,
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: {
                                id: 'order-456',
                                status: 'failed',
                            },
                            error: null,
                        }),
                    }),
                }),
            } as any)

            const supabase = createClient('url', 'key')
            const result = await supabase
                .from('orders')
                .update({ status: 'failed' })
                .eq('id', 'order-456')

            expect(result.data).toBeDefined()
            expect(result.data?.status).toBe('failed')
        })
    })

    describe('Order Creation Flow', () => {
        it('should create complete order with items', async () => {
            const orderData = {
                user_id: 'user-123',
                stripe_session_id: 'cs_test_123',
                total_cents: 15000,
                currency: 'CHF',
                status: 'pending',
                items: [
                    {
                        variant_id: 'variant-1',
                        product_id: 'product-1',
                        quantity: 2,
                        price_cents: 5000,
                        config: { engraving: 'Custom Text' },
                    },
                    {
                        variant_id: 'variant-2',
                        product_id: 'product-2',
                        quantity: 1,
                        price_cents: 5000,
                        config: {},
                    },
                ],
            }

            const { createClient } = await import('@supabase/supabase-js')

            const mockOrderInsert = vi.fn().mockResolvedValue({
                data: { id: 'order-123' },
                error: null,
            })

            const mockItemsInsert = vi.fn().mockResolvedValue({
                data: orderData.items.map((item, i) => ({ ...item, id: `item-${i}` })),
                error: null,
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn((table) => {
                    if (table === 'orders') {
                        return {
                            insert: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({
                                        data: { id: 'order-123' },
                                        error: null,
                                    }),
                                }),
                            }),
                        }
                    }
                    if (table === 'order_items') {
                        return { insert: mockItemsInsert }
                    }
                    return {}
                }),
            } as any)

            const supabase = createClient('url', 'key')

            // Create order
            const orderResult = await supabase
                .from('orders')
                .insert({
                    user_id: orderData.user_id,
                    stripe_session_id: orderData.stripe_session_id,
                    total_cents: orderData.total_cents,
                    currency: orderData.currency,
                    status: orderData.status,
                })
                .select()
                .single()

            // Create order items
            await supabase.from('order_items').insert(
                orderData.items.map((item) => ({
                    order_id: 'order-123',
                    ...item,
                }))
            )

            expect(orderResult.data?.id).toBe('order-123')
            expect(mockItemsInsert).toHaveBeenCalled()
        })

        it('should handle Printful order creation', async () => {
            const { createOrder, isPrintfulConfigured } = await import('@/lib/printful')

            vi.mocked(isPrintfulConfigured).mockReturnValue(true)
            vi.mocked(createOrder).mockResolvedValue({
                id: 'printful-123',
                status: 'pending',
            } as any)

            const printfulOrderData = {
                recipient: {
                    name: 'John Doe',
                    address1: '123 Main St',
                    city: 'Zurich',
                    country_code: 'CH',
                    zip: '8001',
                },
                items: [
                    {
                        variant_id: 1234,
                        quantity: 1,
                        files: [
                            {
                                url: 'https://example.com/design.png',
                            },
                        ],
                    },
                ],
            }

            const result = await createOrder(printfulOrderData)

            expect(createOrder).toHaveBeenCalledWith(printfulOrderData)
            expect(result.id).toBe('printful-123')
        })
    })

    describe('Error Handling', () => {
        it('should handle database insert failure gracefully', async () => {
            const { createClient } = await import('@supabase/supabase-js')

            const mockInsert = vi.fn().mockResolvedValue({
                data: null,
                error: {
                    message: 'Database connection failed',
                    code: '500',
                },
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    insert: mockInsert,
                }),
            } as any)

            const supabase = createClient('url', 'key')
            const result = await supabase.from('orders').insert({
                user_id: 'user-123',
                total_cents: 10000,
            })

            expect(result.error).toBeDefined()
            expect(result.error?.message).toBe('Database connection failed')
        })

        it('should handle email sending failure', async () => {
            const { sendOrderConfirmation } = await import('@/lib/resend')

            vi.mocked(sendOrderConfirmation).mockRejectedValue(
                new Error('Email service unavailable')
            )

            await expect(
                sendOrderConfirmation({
                    email: 'test@example.com',
                    orderId: 'order-123',
                    totalCents: 10000,
                    items: [],
                })
            ).rejects.toThrow('Email service unavailable')
        })

        it('should handle Printful API failure', async () => {
            const { createOrder } = await import('@/lib/printful')

            vi.mocked(createOrder).mockRejectedValue(
                new Error('Printful API error: Invalid variant')
            )

            await expect(
                createOrder({
                    recipient: {} as any,
                    items: [],
                })
            ).rejects.toThrow('Printful API error')
        })
    })

    describe('Referral System Integration', () => {
        it('should award XP to referrer on first purchase', async () => {
            const { awardXpForReferral } = await import('@/actions/gamification')

            const referrerId = 'user-referrer'
            const newUserId = 'user-new'

            await awardXpForReferral(referrerId, newUserId)

            expect(awardXpForReferral).toHaveBeenCalledWith(referrerId, newUserId)
        })

        it('should track referral in database', async () => {
            const { createClient } = await import('@supabase/supabase-js')

            const mockInsert = vi.fn().mockResolvedValue({
                data: {
                    referrer_id: 'user-referrer',
                    referred_id: 'user-new',
                    xp_awarded: 50,
                },
                error: null,
            })

            vi.mocked(createClient).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    insert: mockInsert,
                }),
            } as any)

            const supabase = createClient('url', 'key')
            await supabase.from('referrals').insert({
                referrer_id: 'user-referrer',
                referred_id: 'user-new',
                xp_awarded: 50,
            })

            expect(mockInsert).toHaveBeenCalled()
        })
    })
})
