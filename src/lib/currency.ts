export const SUPPORTED_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

/**
 * Static exchange rates relative to CHF (base currency).
 * In a real app, these would be fetched from an API or database.
 * 1 CHF = X Currency
 */
export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
    CHF: 1,
    EUR: 1.06,  // 1 CHF ~= 1.06 EUR
    USD: 1.12,  // 1 CHF ~= 1.12 USD
    GBP: 0.88,  // 1 CHF ~= 0.88 GBP
}

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
    // Use specific locales for better formatting of specific currencies
    const localeMap: Record<SupportedCurrency, string> = {
        CHF: 'de-CH',
        EUR: 'de-DE', // or en-IE, fr-FR etc. using de-DE for consistent European format
        USD: 'en-US',
        GBP: 'en-GB',
    }

    return new Intl.NumberFormat(localeMap[currency], {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(cents / 100)
}
