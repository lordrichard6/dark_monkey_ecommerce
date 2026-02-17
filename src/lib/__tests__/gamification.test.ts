import { describe, it, expect } from 'vitest'
import {
  TIER_THRESHOLDS,
  getTierForXp,
  getXpToNextTier,
  getXpProgress,
  xpForPurchase,
  XP_REFERRAL_FIRST_PURCHASE,
} from '../gamification'

describe('Gamification System', () => {
  describe('getTierForXp', () => {
    it('should return bronze for 0 XP', () => {
      expect(getTierForXp(0)).toBe('bronze')
    })

    it('should return bronze for XP below silver threshold', () => {
      expect(getTierForXp(TIER_THRESHOLDS.silver - 100)).toBe('bronze')
    })

    it('should return silver at exact threshold', () => {
      expect(getTierForXp(TIER_THRESHOLDS.silver)).toBe('silver')
    })

    it('should return gold at exact threshold', () => {
      expect(getTierForXp(TIER_THRESHOLDS.gold)).toBe('gold')
    })

    it('should return platinum at exact threshold', () => {
      expect(getTierForXp(TIER_THRESHOLDS.platinum)).toBe('platinum')
    })
  })

  describe('getXpToNextTier', () => {
    it('should return spend needed to next tier', () => {
      const result = getXpToNextTier(0)
      expect(result).toBe(TIER_THRESHOLDS.silver)
    })

    it('should calculate spend needed correctly mid-tier', () => {
      const result = getXpToNextTier(TIER_THRESHOLDS.silver / 2)
      expect(result).toBe(TIER_THRESHOLDS.silver / 2)
    })

    it('should return null for platinum tier (max tier)', () => {
      const result = getXpToNextTier(TIER_THRESHOLDS.platinum)
      expect(result).toBeNull()
    })
  })

  describe('getXpProgress', () => {
    it('should calculate progress percentage', () => {
      const result = getXpProgress(TIER_THRESHOLDS.silver / 2)
      expect(result).toBe(50)
    })

    it('should show 0% at tier start', () => {
      const result = getXpProgress(0)
      expect(result).toBe(0)
    })

    it('should show 100% for max tier', () => {
      const result = getXpProgress(TIER_THRESHOLDS.platinum)
      expect(result).toBe(100)
    })
  })

  describe('xpForPurchase', () => {
    it('should award 1 point per CHF spent', () => {
      expect(xpForPurchase(1000)).toBe(10) // 10 CHF
      expect(xpForPurchase(5000)).toBe(50) // 50 CHF
    })
  })

  describe('Referral XP', () => {
    it('should award correct points for referral', () => {
      expect(XP_REFERRAL_FIRST_PURCHASE).toBe(500)
    })
  })
})
