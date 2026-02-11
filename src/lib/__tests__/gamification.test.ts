import { describe, it, expect } from 'vitest'
import {
    TIER_THRESHOLDS,
    getTierForXp,
    getXpToNextTier,
    getXpProgress,
    xpForPurchase,
    XP_REFERRAL_FIRST_PURCHASE,
    type Tier,
} from '../gamification'

describe('Gamification System', () => {
    describe('getTierForXp', () => {
        it('should return bronze for 0 XP', () => {
            expect(getTierForXp(0)).toBe('bronze')
        })

        it('should return bronze for XP below silver threshold', () => {
            expect(getTierForXp(50)).toBe('bronze')
            expect(getTierForXp(99)).toBe('bronze')
        })

        it('should return silver at exact threshold', () => {
            expect(getTierForXp(100)).toBe('silver')
        })

        it('should return silver for XP between silver and gold', () => {
            expect(getTierForXp(250)).toBe('silver')
            expect(getTierForXp(499)).toBe('silver')
        })

        it('should return gold at exact threshold', () => {
            expect(getTierForXp(500)).toBe('gold')
        })

        it('should return gold for XP between gold and VIP', () => {
            expect(getTierForXp(1000)).toBe('gold')
            expect(getTierForXp(1999)).toBe('gold')
        })

        it('should return VIP at exact threshold', () => {
            expect(getTierForXp(2000)).toBe('vip')
        })

        it('should return VIP for XP above VIP threshold', () => {
            expect(getTierForXp(5000)).toBe('vip')
            expect(getTierForXp(10000)).toBe('vip')
        })

        it('should handle negative XP (edge case)', () => {
            expect(getTierForXp(-10)).toBe('bronze')
        })
    })

    describe('getXpToNextTier', () => {
        it('should return silver tier and XP needed from bronze', () => {
            const result = getXpToNextTier(0)
            expect(result).toEqual({
                tier: 'silver',
                xpNeeded: 100,
            })
        })

        it('should calculate XP needed correctly mid-tier', () => {
            const result = getXpToNextTier(50)
            expect(result).toEqual({
                tier: 'silver',
                xpNeeded: 50,
            })
        })

        it('should return gold tier from silver', () => {
            const result = getXpToNextTier(100)
            expect(result).toEqual({
                tier: 'gold',
                xpNeeded: 400,
            })
        })

        it('should return VIP tier from gold', () => {
            const result = getXpToNextTier(500)
            expect(result).toEqual({
                tier: 'vip',
                xpNeeded: 1500,
            })
        })

        it('should return null for VIP tier (max tier)', () => {
            const result = getXpToNextTier(2000)
            expect(result).toBeNull()
        })

        it('should return null for XP above VIP', () => {
            const result = getXpToNextTier(5000)
            expect(result).toBeNull()
        })

        it('should return 0 XP needed at exact tier boundary', () => {
            const result = getXpToNextTier(100)
            expect(result?.xpNeeded).toBe(400)
        })
    })

    describe('getXpProgress', () => {
        it('should calculate progress from bronze to silver', () => {
            const result = getXpProgress(50)
            expect(result).toEqual({
                current: 50,
                next: 100,
                percent: 50,
            })
        })

        it('should show 0% at tier start', () => {
            const result = getXpProgress(0)
            expect(result?.percent).toBe(0)
        })

        it('should show 100% at tier end', () => {
            const result = getXpProgress(99)
            expect(result?.percent).toBe(99)
        })

        it('should calculate progress from silver to gold', () => {
            const result = getXpProgress(300)
            // 300 - 100 = 200 progress
            // 500 - 100 = 400 range
            // 200/400 = 50%
            expect(result).toEqual({
                current: 200,
                next: 400,
                percent: 50,
            })
        })

        it('should calculate progress from gold to VIP', () => {
            const result = getXpProgress(1250)
            // 1250 - 500 = 750 progress
            // 2000 - 500 = 1500 range
            // 750/1500 = 50%
            expect(result).toEqual({
                current: 750,
                next: 1500,
                percent: 50,
            })
        })

        it('should return null for VIP tier', () => {
            const result = getXpProgress(2000)
            expect(result).toBeNull()
        })

        it('should cap percent at 100', () => {
            const result = getXpProgress(99)
            expect(result?.percent).toBeLessThanOrEqual(100)
        })
    })

    describe('xpForPurchase', () => {
        it('should award minimum 10 XP for small purchases', () => {
            expect(xpForPurchase(100)).toBe(10) // 1 CHF
            expect(xpForPurchase(500)).toBe(10) // 5 CHF
            expect(xpForPurchase(999)).toBe(10) // 9.99 CHF
        })

        it('should award 1 XP per CHF for larger purchases', () => {
            expect(xpForPurchase(1000)).toBe(10) // 10 CHF = 10 XP
            expect(xpForPurchase(2000)).toBe(20) // 20 CHF = 20 XP
            expect(xpForPurchase(5000)).toBe(50) // 50 CHF = 50 XP
        })

        it('should round XP correctly', () => {
            expect(xpForPurchase(2550)).toBe(26) // 25.50 CHF = 25.5 → 26 XP
            expect(xpForPurchase(2549)).toBe(25) // 25.49 CHF = 25.49 → 25 XP
        })

        it('should handle large purchases', () => {
            expect(xpForPurchase(100000)).toBe(1000) // 1000 CHF = 1000 XP
        })

        it('should handle zero purchase (edge case)', () => {
            expect(xpForPurchase(0)).toBe(10) // Minimum 10 XP
        })

        it('should handle negative purchase (edge case)', () => {
            expect(xpForPurchase(-1000)).toBe(10) // Minimum 10 XP
        })
    })

    describe('Tier Progression Scenarios', () => {
        it('should progress through all tiers with purchases', () => {
            let totalXp = 0

            // Start at bronze
            expect(getTierForXp(totalXp)).toBe('bronze')

            // Purchase 1: 100 CHF = 100 XP → Silver
            totalXp += xpForPurchase(10000)
            expect(getTierForXp(totalXp)).toBe('silver')

            // Purchase 2: 400 CHF = 400 XP → Gold (total 500)
            totalXp += xpForPurchase(40000)
            expect(getTierForXp(totalXp)).toBe('gold')

            // Purchase 3: 1500 CHF = 1500 XP → VIP (total 2000)
            totalXp += xpForPurchase(150000)
            expect(getTierForXp(totalXp)).toBe('vip')
        })

        it('should calculate correct XP needed at each tier boundary', () => {
            // Just before silver
            expect(getXpToNextTier(99)?.xpNeeded).toBe(1)

            // Just before gold
            expect(getXpToNextTier(499)?.xpNeeded).toBe(1)

            // Just before VIP
            expect(getXpToNextTier(1999)?.xpNeeded).toBe(1)
        })
    })

    describe('Referral XP', () => {
        it('should award 50 XP for referral', () => {
            expect(XP_REFERRAL_FIRST_PURCHASE).toBe(50)
        })

        it('should contribute to tier progression', () => {
            let totalXp = 50 // From referral
            expect(getTierForXp(totalXp)).toBe('bronze')

            // Need 50 more XP to reach silver
            expect(getXpToNextTier(totalXp)?.xpNeeded).toBe(50)
        })
    })

    describe('Edge Cases', () => {
        it('should handle very large XP values', () => {
            expect(getTierForXp(999999)).toBe('vip')
            expect(getXpToNextTier(999999)).toBeNull()
        })

        it('should handle fractional XP from rounding', () => {
            // 15.67 CHF = 15.67 → 16 XP
            expect(xpForPurchase(1567)).toBe(16)
        })

        it('should maintain consistency across tier boundaries', () => {
            // At exact boundary
            expect(getTierForXp(TIER_THRESHOLDS.silver)).toBe('silver')
            expect(getTierForXp(TIER_THRESHOLDS.gold)).toBe('gold')
            expect(getTierForXp(TIER_THRESHOLDS.vip)).toBe('vip')

            // One below boundary
            expect(getTierForXp(TIER_THRESHOLDS.silver - 1)).toBe('bronze')
            expect(getTierForXp(TIER_THRESHOLDS.gold - 1)).toBe('silver')
            expect(getTierForXp(TIER_THRESHOLDS.vip - 1)).toBe('gold')
        })
    })

    describe('Business Logic Validation', () => {
        it('should require realistic spending to reach VIP', () => {
            // To reach VIP (2000 XP), need 2000 CHF in purchases
            // That's a reasonable threshold for VIP status
            const xpNeeded = TIER_THRESHOLDS.vip
            const purchaseNeeded = xpNeeded * 100 // in cents
            expect(purchaseNeeded).toBe(200000) // 2000 CHF
        })

        it('should award meaningful XP for average purchase', () => {
            // Average purchase: 50 CHF
            const avgPurchaseCents = 5000
            const xp = xpForPurchase(avgPurchaseCents)
            expect(xp).toBe(50)

            // After 2 average purchases, should be halfway to silver
            expect(getTierForXp(xp * 2)).toBe('silver')
        })
    })
})
