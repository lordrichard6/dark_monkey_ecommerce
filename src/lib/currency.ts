/**
 * Multi-Currency Support Utilities
 * Handles currency conversion, formatting, and user preferences
 */

import Cookies from 'js-cookie'

export const SUPPORTED_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export type CurrencyInfo = {
    code: SupportedCurrency
    symbol: string
    flag: string
    name: string
    locale: string
}

export const CURRENCY_INFO: Record<SupportedCurrency, CurrencyInfo> = {
    CHF: {
        code: 'CHF',
        symbol: 'Fr.',
        flag: '🇨🇭',
        name: 'Swiss Franc',
        locale: 'de-CH',
    },
    EUR: {
        code: 'EUR',
        symbol: '€',
        flag: '🇪🇺',
        name: 'Euro',
        locale: 'de-DE',
    },
    USD: {
        code: 'USD',
        symbol: '$',
        flag: '🇺🇸',
        name: 'US Dollar',
        locale: 'en-US',
    },
    GBP: {
        code: 'GBP',
        symbol: '£',
        flag: '🇬🇧',
        name: 'British Pound',
        locale: 'en-GB',
    },
}

/**
 * Static exchange rates relative to CHF (base currency).
 * Updated: February 11, 2026
 * 1 CHF = X Currency
 */
export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
    CHF: 1,
    EUR: 0.95,  // 1 CHF = 0.95 EUR
    USD: 1.05,  // 1 CHF = 1.05 USD
    GBP: 0.80,  // 1 CHF = 0.80 GBP
}

const CURRENCY_COOKIE_NAME = 'preferred_currency'

/**
 * Convert price in cents from CHF (base) to target currency.
 */
export function convertPrice(cents: number, toCurrency: SupportedCurrency): number {
    if (toCurrency === 'CHF') return cents
    const rate = EXCHANGE_RATES[toCurrency]
    return Math.round(cents * rate)
}

/**
 * Format price in cents to a localized currency string.
 */
export function formatPrice(cents: number, currency: SupportedCurrency = 'CHF'): string {
    const { locale } = CURRENCY_INFO[currency]

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(cents / 100)
}

/**
 * Get currency preference from cookie
 */
export function getCurrencyFromCookie(): SupportedCurrency {
    if (typeof window === 'undefined') return 'CHF'

    const cookie = Cookies.get(CURRENCY_COOKIE_NAME)

    if (cookie && SUPPORTED_CURRENCIES.includes(cookie as SupportedCurrency)) {
        return cookie as SupportedCurrency
    }

    return 'CHF'
}

/**
 * Save currency preference to cookie
 */
export function saveCurrencyToCookie(currency: SupportedCurrency): void {
    Cookies.set(CURRENCY_COOKIE_NAME, currency, {
        expires: 365, // 1 year
        sameSite: 'lax',
    })
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCY_INFO)
}

/**
 * Check if a string is a valid currency code
 */
export function isValidCurrency(code: string): code is SupportedCurrency {
    return SUPPORTED_CURRENCIES.includes(code as SupportedCurrency)
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
    return CURRENCY_INFO[currency].symbol
}

/**
 * Convert and format price in one step
 */
export function convertAndFormat(
    centsInCHF: number,
    toCurrency: SupportedCurrency
): string {
    const converted = convertPrice(centsInCHF, toCurrency)
    return formatPrice(converted, toCurrency)
}

