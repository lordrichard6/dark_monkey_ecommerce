import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAvailableCurrencies,
  isValidCurrency,
  getCurrencySymbol,
  convertAndFormat,
  getCurrencyFromCookie,
  saveCurrencyToCookie,
  SUPPORTED_CURRENCIES,
  CURRENCY_INFO,
} from '../currency'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

describe('currency utils (extended coverage)', () => {
  describe('getAvailableCurrencies', () => {
    it('returns all 4 supported currencies', () => {
      const currencies = getAvailableCurrencies()
      expect(currencies).toHaveLength(4)
    })

    it('includes CHF, EUR, USD, GBP', () => {
      const codes = getAvailableCurrencies().map((c) => c.code)
      expect(codes).toContain('CHF')
      expect(codes).toContain('EUR')
      expect(codes).toContain('USD')
      expect(codes).toContain('GBP')
    })

    it('each entry has required fields', () => {
      for (const c of getAvailableCurrencies()) {
        expect(c).toHaveProperty('code')
        expect(c).toHaveProperty('symbol')
        expect(c).toHaveProperty('flag')
        expect(c).toHaveProperty('name')
        expect(c).toHaveProperty('locale')
      }
    })
  })

  describe('isValidCurrency', () => {
    it('returns true for all supported currencies', () => {
      for (const code of SUPPORTED_CURRENCIES) {
        expect(isValidCurrency(code)).toBe(true)
      }
    })

    it('returns false for unknown currency code', () => {
      expect(isValidCurrency('JPY')).toBe(false)
      expect(isValidCurrency('AUD')).toBe(false)
      expect(isValidCurrency('')).toBe(false)
      expect(isValidCurrency('chf')).toBe(false) // case-sensitive
    })
  })

  describe('getCurrencySymbol', () => {
    it('returns Fr. for CHF', () => {
      expect(getCurrencySymbol('CHF')).toBe('Fr.')
    })

    it('returns € for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€')
    })

    it('returns $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('returns £ for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£')
    })
  })

  describe('convertAndFormat', () => {
    it('returns CHF string unchanged', () => {
      const result = convertAndFormat(10000, 'CHF')
      expect(result).toContain('10')
      expect(result).toContain('CHF')
    })

    it('converts and formats EUR correctly', () => {
      const result = convertAndFormat(10000, 'EUR') // 100 CHF → 95 EUR
      expect(result).toContain('9')
    })

    it('returns a non-empty string for all currencies', () => {
      for (const currency of SUPPORTED_CURRENCIES) {
        const result = convertAndFormat(5000, currency)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getCurrencyFromCookie', () => {
    let Cookies: typeof import('js-cookie').default

    beforeEach(async () => {
      Cookies = (await import('js-cookie')).default
      vi.clearAllMocks()
    })

    it('returns CHF when no cookie is set', () => {
      vi.mocked(Cookies.get).mockReturnValue(undefined as any)
      const result = getCurrencyFromCookie()
      expect(result).toBe('CHF')
    })

    it('returns the stored currency if valid', () => {
      vi.mocked(Cookies.get).mockReturnValue('EUR' as any)
      const result = getCurrencyFromCookie()
      expect(result).toBe('EUR')
    })

    it('returns CHF for an invalid stored value', () => {
      vi.mocked(Cookies.get).mockReturnValue('INVALID' as any)
      const result = getCurrencyFromCookie()
      expect(result).toBe('CHF')
    })

    it('accepts all supported currencies from cookie', () => {
      for (const code of SUPPORTED_CURRENCIES) {
        vi.mocked(Cookies.get).mockReturnValue(code as any)
        expect(getCurrencyFromCookie()).toBe(code)
      }
    })
  })

  describe('saveCurrencyToCookie', () => {
    let Cookies: typeof import('js-cookie').default

    beforeEach(async () => {
      Cookies = (await import('js-cookie')).default
      vi.clearAllMocks()
    })

    it('calls Cookies.set with the correct currency', () => {
      saveCurrencyToCookie('EUR')
      expect(Cookies.set).toHaveBeenCalledWith(
        'preferred_currency',
        'EUR',
        expect.objectContaining({ expires: 365 })
      )
    })

    it('sets sameSite: lax', () => {
      saveCurrencyToCookie('GBP')
      expect(Cookies.set).toHaveBeenCalledWith(
        'preferred_currency',
        'GBP',
        expect.objectContaining({ sameSite: 'lax' })
      )
    })
  })
})
