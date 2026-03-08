import { describe, it, expect } from 'vitest'
import {
  calculateShipping,
  ALLOWED_SHIPPING_COUNTRIES,
  SHIPPING_ZONES,
  FREE_SHIPPING_THRESHOLD_CENTS,
  COUNTRY_LABELS,
} from '../shipping'

describe('calculateShipping', () => {
  describe('free shipping threshold', () => {
    it('gives free shipping when subtotal equals threshold', () => {
      const result = calculateShipping('CH', 1, FREE_SHIPPING_THRESHOLD_CENTS)
      expect(result.isFreeShipping).toBe(true)
      expect(result.shippingCents).toBe(0)
      expect(result.freeShippingRemaining).toBe(0)
    })

    it('gives free shipping when subtotal exceeds threshold', () => {
      const result = calculateShipping('CH', 3, FREE_SHIPPING_THRESHOLD_CENTS + 500)
      expect(result.isFreeShipping).toBe(true)
      expect(result.shippingCents).toBe(0)
    })

    it('calculates remaining amount for free shipping', () => {
      const subtotal = FREE_SHIPPING_THRESHOLD_CENTS - 1000
      const result = calculateShipping('CH', 1, subtotal)
      expect(result.freeShippingRemaining).toBe(1000)
      expect(result.isFreeShipping).toBe(false)
    })
  })

  describe('Switzerland (CH)', () => {
    it('calculates shipping for 1 item', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('CH'))!
      const result = calculateShipping('CH', 1, 0)
      expect(result.shippingCents).toBe(zone.firstItemCents)
      expect(result.isFreeShipping).toBe(false)
      expect(result.zoneName).toBe('Switzerland')
    })

    it('calculates shipping for multiple items', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('CH'))!
      const result = calculateShipping('CH', 3, 0)
      const expected = zone.firstItemCents + 2 * zone.additionalItemCents
      expect(result.shippingCents).toBe(expected)
    })
  })

  describe('European countries', () => {
    const euCountries = ['PT', 'ES', 'FR', 'DE']

    euCountries.forEach((country) => {
      it(`calculates shipping for ${country}`, () => {
        const zone = SHIPPING_ZONES.find((z) => z.countries.includes(country))!
        const result = calculateShipping(country, 1, 0)
        expect(result.shippingCents).toBe(zone.firstItemCents)
        expect(result.zoneName).toBe('Europe')
      })
    })

    it('calculates multi-item shipping for EU', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('PT'))!
      const result = calculateShipping('PT', 2, 0)
      expect(result.shippingCents).toBe(zone.firstItemCents + zone.additionalItemCents)
    })
  })

  describe('UK (GB)', () => {
    it('calculates shipping for 1 item', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('GB'))!
      const result = calculateShipping('GB', 1, 0)
      expect(result.shippingCents).toBe(zone.firstItemCents)
      expect(result.zoneName).toBe('UK')
    })
  })

  describe('USA (US)', () => {
    it('calculates shipping for 1 item', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('US'))!
      const result = calculateShipping('US', 1, 0)
      expect(result.shippingCents).toBe(zone.firstItemCents)
      expect(result.zoneName).toBe('USA')
    })
  })

  describe('unsupported country', () => {
    it('returns zero shipping for unknown country', () => {
      const result = calculateShipping('JP', 1, 0)
      expect(result.shippingCents).toBe(0)
      expect(result.isFreeShipping).toBe(false)
      expect(result.zoneName).toBe('')
      expect(result.freeShippingRemaining).toBe(0)
    })

    it('returns zero shipping for empty country code', () => {
      const result = calculateShipping('', 1, 0)
      expect(result.shippingCents).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('treats 0 items as 1 item minimum', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('CH'))!
      const result = calculateShipping('CH', 0, 0)
      expect(result.shippingCents).toBe(zone.firstItemCents)
    })

    it('does not add additional cost for exactly 1 item', () => {
      const zone = SHIPPING_ZONES.find((z) => z.countries.includes('US'))!
      const result = calculateShipping('US', 1, 0)
      expect(result.shippingCents).toBe(zone.firstItemCents)
    })
  })
})

describe('ALLOWED_SHIPPING_COUNTRIES', () => {
  it('includes all expected countries', () => {
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('CH')
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('PT')
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('ES')
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('FR')
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('DE')
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('GB')
    expect(ALLOWED_SHIPPING_COUNTRIES).toContain('US')
  })

  it('does not include unsupported countries', () => {
    expect(ALLOWED_SHIPPING_COUNTRIES).not.toContain('JP')
    expect(ALLOWED_SHIPPING_COUNTRIES).not.toContain('AU')
  })
})

describe('COUNTRY_LABELS', () => {
  it('has labels for all allowed countries', () => {
    for (const code of ALLOWED_SHIPPING_COUNTRIES) {
      expect(COUNTRY_LABELS[code]).toBeDefined()
    }
  })
})
