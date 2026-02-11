import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateDiscountCode, type ValidateDiscountResult } from '../checkout'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

describe('Checkout Validation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('validateDiscountCode', () => {
        it('should reject empty discount code', async () => {
            const result = await validateDiscountCode('', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Code is required',
            })
        })

        it('should reject whitespace-only code', async () => {
            const result = await validateDiscountCode('   ', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Code is required',
            })
        })

        it('should trim and uppercase the code', async () => {
            const { createClient } = await import('@/lib/supabase/server')
            const mockSelect = vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'discount-1',
                            code: 'SAVE10',
                            type: 'percentage',
                            value_cents: 1000, // 10%
                            min_order_cents: 0,
                            valid_from: new Date(Date.now() - 86400000).toISOString(),
                            valid_until: new Date(Date.now() + 86400000).toISOString(),
                            max_uses: null,
                            use_count: 0,
                        },
                        error: null,
                    }),
                }),
            })

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: mockSelect,
                }),
            } as any)

            await validateDiscountCode('  save10  ', 10000)

            // Verify ilike was called with uppercase trimmed code
            expect(mockSelect().ilike).toHaveBeenCalledWith('code', 'SAVE10')
        })

        it('should reject invalid discount code', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Not found' },
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('INVALID', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Invalid or expired code',
            })
        })

        it('should reject code not yet valid', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-1',
                                    code: 'FUTURE',
                                    type: 'percentage',
                                    value_cents: 1000,
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('FUTURE', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Code not yet valid',
            })
        })

        it('should reject expired code', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-1',
                                    code: 'EXPIRED',
                                    type: 'percentage',
                                    value_cents: 1000,
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                                    valid_until: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('EXPIRED', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Code has expired',
            })
        })

        it('should reject code that reached max uses', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-1',
                                    code: 'MAXED',
                                    type: 'percentage',
                                    value_cents: 1000,
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: 100,
                                    use_count: 100,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('MAXED', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Code has reached maximum uses',
            })
        })

        it('should reject code when order below minimum', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-1',
                                    code: 'BIGORDER',
                                    type: 'percentage',
                                    value_cents: 1000,
                                    min_order_cents: 10000, // 100 CHF minimum
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('BIGORDER', 5000) // 50 CHF order
            expect(result).toEqual({
                ok: false,
                error: 'Minimum order is 100 CHF',
            })
        })

        it('should calculate percentage discount correctly', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-1',
                                    code: 'SAVE10',
                                    type: 'percentage',
                                    value_cents: 1000, // 10%
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('SAVE10', 10000) // 100 CHF
            expect(result).toEqual({
                ok: true,
                discountId: 'discount-1',
                discountCents: 1000, // 10 CHF
                code: 'SAVE10',
            })
        })

        it('should calculate fixed discount correctly', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-2',
                                    code: 'SAVE20',
                                    type: 'fixed',
                                    value_cents: 2000, // 20 CHF
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('SAVE20', 10000) // 100 CHF
            expect(result).toEqual({
                ok: true,
                discountId: 'discount-2',
                discountCents: 2000, // 20 CHF
                code: 'SAVE20',
            })
        })

        it('should cap fixed discount at subtotal', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-3',
                                    code: 'HUGE',
                                    type: 'fixed',
                                    value_cents: 10000, // 100 CHF
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('HUGE', 5000) // 50 CHF order
            expect(result).toEqual({
                ok: true,
                discountId: 'discount-3',
                discountCents: 5000, // Capped at order total
                code: 'HUGE',
            })
        })

        it('should reject discount with zero value', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-4',
                                    code: 'ZERO',
                                    type: 'fixed',
                                    value_cents: 0,
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('ZERO', 10000)
            expect(result).toEqual({
                ok: false,
                error: 'Invalid discount value',
            })
        })

        it('should handle percentage rounding correctly', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'discount-5',
                                    code: 'SAVE15',
                                    type: 'percentage',
                                    value_cents: 1500, // 15%
                                    min_order_cents: 0,
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null,
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('SAVE15', 3333) // 33.33 CHF
            // 15% of 3333 = 499.95 → rounds to 500
            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.discountCents).toBe(500)
            }
        })
    })

    describe('Business Logic Scenarios', () => {
        it('should handle Black Friday scenario', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'bf-2024',
                                    code: 'BLACKFRIDAY',
                                    type: 'percentage',
                                    value_cents: 2500, // 25%
                                    min_order_cents: 5000, // 50 CHF minimum
                                    valid_from: new Date('2024-11-29').toISOString(),
                                    valid_until: new Date('2024-12-02').toISOString(),
                                    max_uses: 1000,
                                    use_count: 500,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            // Mock current date to be during Black Friday
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2024-11-30'))

            const result = await validateDiscountCode('BLACKFRIDAY', 10000)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.discountCents).toBe(2500) // 25% of 100 CHF = 25 CHF
            }

            vi.useRealTimers()
        })

        it('should handle first-time customer discount', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'welcome-10',
                                    code: 'WELCOME10',
                                    type: 'fixed',
                                    value_cents: 1000, // 10 CHF off
                                    min_order_cents: 3000, // 30 CHF minimum
                                    valid_from: new Date(Date.now() - 86400000).toISOString(),
                                    valid_until: null,
                                    max_uses: null, // Unlimited uses
                                    use_count: 0,
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            } as any)

            const result = await validateDiscountCode('WELCOME10', 5000) // 50 CHF order

            expect(result).toEqual({
                ok: true,
                discountId: 'welcome-10',
                discountCents: 1000,
                code: 'WELCOME10',
            })
        })
    })
})
