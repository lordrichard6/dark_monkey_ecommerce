import { describe, it, expect } from 'vitest'
import {
    SUPPORTED_CURRENCIES,
    EXCHANGE_RATES,
    convertPrice,
    formatPrice,
    type SupportedCurrency,
} from '../currency'

describe('Currency and Pricing', () => {
    describe('convertPrice', () => {
        it('should return same price for CHF (base currency)', () => {
            expect(convertPrice(10000, 'CHF')).toBe(10000)
            expect(convertPrice(5000, 'CHF')).toBe(5000)
            expect(convertPrice(0, 'CHF')).toBe(0)
        })

        it('should convert CHF to EUR correctly', () => {
            // 100 CHF = 106 EUR (rate 1.06)
            expect(convertPrice(10000, 'EUR')).toBe(10600)

            // 50 CHF = 53 EUR
            expect(convertPrice(5000, 'EUR')).toBe(5300)
        })

        it('should convert CHF to USD correctly', () => {
            // 100 CHF = 112 USD (rate 1.12)
            expect(convertPrice(10000, 'USD')).toBe(11200)

            // 50 CHF = 56 USD
            expect(convertPrice(5000, 'USD')).toBe(5600)
        })

        it('should convert CHF to GBP correctly', () => {
            // 100 CHF = 88 GBP (rate 0.88)
            expect(convertPrice(10000, 'GBP')).toBe(8800)

            // 50 CHF = 44 GBP
            expect(convertPrice(5000, 'GBP')).toBe(4400)
        })

        it('should round to nearest cent', () => {
            // 33.33 CHF to EUR = 35.3298 → 3533 cents
            expect(convertPrice(3333, 'EUR')).toBe(3533)

            // 33.33 CHF to USD = 37.3296 → 3733 cents
            expect(convertPrice(3333, 'USD')).toBe(3733)
        })

        it('should handle zero amount', () => {
            expect(convertPrice(0, 'EUR')).toBe(0)
            expect(convertPrice(0, 'USD')).toBe(0)
            expect(convertPrice(0, 'GBP')).toBe(0)
        })

        it('should handle large amounts', () => {
            // 10,000 CHF to USD
            expect(convertPrice(1000000, 'USD')).toBe(1120000)
        })

        it('should handle negative amounts (refunds)', () => {
            expect(convertPrice(-10000, 'EUR')).toBe(-10600)
            expect(convertPrice(-5000, 'USD')).toBe(-5600)
        })
    })

    describe('formatPrice', () => {
        it('should format CHF correctly', () => {
            expect(formatPrice(10000, 'CHF')).toMatch(/100[.,]00/)
            expect(formatPrice(5000, 'CHF')).toMatch(/50[.,]00/)
        })

        it('should format EUR correctly', () => {
            const formatted = formatPrice(10000, 'EUR')
            expect(formatted).toContain('€')
            expect(formatted).toMatch(/100[.,]00/)
        })

        it('should format USD correctly', () => {
            const formatted = formatPrice(10000, 'USD')
            expect(formatted).toContain('$')
            expect(formatted).toContain('100.00')
        })

        it('should format GBP correctly', () => {
            const formatted = formatPrice(10000, 'GBP')
            expect(formatted).toContain('£')
            expect(formatted).toMatch(/100[.,]00/)
        })

        it('should default to CHF when no currency specified', () => {
            const formatted = formatPrice(10000)
            expect(formatted).toMatch(/CHF|Fr/)
        })

        it('should handle zero amount', () => {
            expect(formatPrice(0, 'CHF')).toMatch(/0[.,]00/)
            expect(formatPrice(0, 'USD')).toContain('$0.00')
        })

        it('should handle fractional cents correctly', () => {
            // 99.99 CHF
            expect(formatPrice(9999, 'CHF')).toMatch(/99[.,]99/)

            // 1.01 USD
            expect(formatPrice(101, 'USD')).toContain('$1.01')
        })

        it('should always show 2 decimal places', () => {
            // Even for whole amounts
            expect(formatPrice(10000, 'USD')).toContain('.00')
            expect(formatPrice(5000, 'EUR')).toMatch(/[.,]00/)
        })
    })

    describe('Exchange Rates', () => {
        it('should have all supported currencies defined', () => {
            SUPPORTED_CURRENCIES.forEach((currency) => {
                expect(EXCHANGE_RATES[currency]).toBeDefined()
                expect(typeof EXCHANGE_RATES[currency]).toBe('number')
                expect(EXCHANGE_RATES[currency]).toBeGreaterThan(0)
            })
        })

        it('should have CHF as base currency (rate 1)', () => {
            expect(EXCHANGE_RATES.CHF).toBe(1)
        })

        it('should have realistic exchange rates', () => {
            // EUR should be close to CHF (within 0.8-1.2 range)
            expect(EXCHANGE_RATES.EUR).toBeGreaterThan(0.8)
            expect(EXCHANGE_RATES.EUR).toBeLessThan(1.2)

            // USD should be slightly higher than CHF
            expect(EXCHANGE_RATES.USD).toBeGreaterThan(1)
            expect(EXCHANGE_RATES.USD).toBeLessThan(1.5)

            // GBP should be slightly lower than CHF
            expect(EXCHANGE_RATES.GBP).toBeGreaterThan(0.7)
            expect(EXCHANGE_RATES.GBP).toBeLessThan(1)
        })
    })

    describe('Real-World Pricing Scenarios', () => {
        it('should handle typical product price (50 CHF)', () => {
            const priceCHF = 5000 // 50 CHF

            expect(convertPrice(priceCHF, 'CHF')).toBe(5000)
            expect(convertPrice(priceCHF, 'EUR')).toBe(5300) // ~53 EUR
            expect(convertPrice(priceCHF, 'USD')).toBe(5600) // ~56 USD
            expect(convertPrice(priceCHF, 'GBP')).toBe(4400) // ~44 GBP
        })

        it('should handle premium product price (200 CHF)', () => {
            const priceCHF = 20000 // 200 CHF

            expect(convertPrice(priceCHF, 'EUR')).toBe(21200) // ~212 EUR
            expect(convertPrice(priceCHF, 'USD')).toBe(22400) // ~224 USD
            expect(convertPrice(priceCHF, 'GBP')).toBe(17600) // ~176 GBP
        })

        it('should handle discount application across currencies', () => {
            const originalPrice = 10000 // 100 CHF
            const discountPercent = 10 // 10%
            const discountedPrice = originalPrice - (originalPrice * discountPercent / 100)

            // Apply discount in CHF, then convert
            expect(convertPrice(discountedPrice, 'EUR')).toBe(9540) // 90 CHF → 95.40 EUR
            expect(convertPrice(discountedPrice, 'USD')).toBe(10080) // 90 CHF → 100.80 USD
        })

        it('should maintain price consistency across conversions', () => {
            const prices = [1000, 2500, 5000, 10000, 25000]

            prices.forEach((price) => {
                // Converting to CHF should always return original price
                expect(convertPrice(price, 'CHF')).toBe(price)

                // Converting to other currencies should be proportional
                const eurPrice = convertPrice(price, 'EUR')
                const usdPrice = convertPrice(price, 'USD')
                const gbpPrice = convertPrice(price, 'GBP')

                // EUR should be higher than CHF
                expect(eurPrice).toBeGreaterThan(price)

                // USD should be higher than EUR
                expect(usdPrice).toBeGreaterThan(eurPrice)

                // GBP should be lower than CHF
                expect(gbpPrice).toBeLessThan(price)
            })
        })

        it('should handle cart total calculation', () => {
            // Cart with 3 items
            const items = [
                { priceCents: 5000, quantity: 2 }, // 2x 50 CHF
                { priceCents: 10000, quantity: 1 }, // 1x 100 CHF
                { priceCents: 2500, quantity: 3 }, // 3x 25 CHF
            ]

            const totalCHF = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
            expect(totalCHF).toBe(27500) // 275 CHF

            // Convert total to other currencies
            expect(convertPrice(totalCHF, 'EUR')).toBe(29150) // ~291.50 EUR
            expect(convertPrice(totalCHF, 'USD')).toBe(30800) // ~308 USD
            expect(convertPrice(totalCHF, 'GBP')).toBe(24200) // ~242 GBP
        })

        it('should handle shipping costs in different currencies', () => {
            const shippingCHF = 500 // 5 CHF

            expect(convertPrice(shippingCHF, 'EUR')).toBe(530) // ~5.30 EUR
            expect(convertPrice(shippingCHF, 'USD')).toBe(560) // ~5.60 USD
            expect(convertPrice(shippingCHF, 'GBP')).toBe(440) // ~4.40 GBP
        })
    })

    describe('Edge Cases', () => {
        it('should handle 1 cent', () => {
            expect(convertPrice(1, 'EUR')).toBe(1) // Rounds to 1
            expect(convertPrice(1, 'USD')).toBe(1) // Rounds to 1
            expect(convertPrice(1, 'GBP')).toBe(1) // Rounds to 1
        })

        it('should handle odd amounts with rounding', () => {
            // 12.34 CHF
            expect(convertPrice(1234, 'EUR')).toBe(1308) // 13.08 EUR
            expect(convertPrice(1234, 'USD')).toBe(1382) // 13.82 USD
            expect(convertPrice(1234, 'GBP')).toBe(1086) // 10.86 GBP
        })

        it('should handle maximum safe integer', () => {
            const maxSafe = Number.MAX_SAFE_INTEGER
            expect(() => convertPrice(maxSafe, 'EUR')).not.toThrow()
        })
    })

    describe('Type Safety', () => {
        it('should only accept supported currencies', () => {
            const validCurrencies: SupportedCurrency[] = ['CHF', 'EUR', 'USD', 'GBP']

            validCurrencies.forEach((currency) => {
                expect(() => convertPrice(1000, currency)).not.toThrow()
                expect(() => formatPrice(1000, currency)).not.toThrow()
            })
        })

        it('should have correct number of supported currencies', () => {
            expect(SUPPORTED_CURRENCIES).toHaveLength(4)
        })
    })
})
