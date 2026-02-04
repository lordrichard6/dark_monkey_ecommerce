'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SUPPORTED_CURRENCIES, SupportedCurrency, formatPrice, convertPrice } from '@/lib/currency'

type CurrencyContextType = {
    currency: SupportedCurrency
    setCurrency: (currency: SupportedCurrency) => void
    format: (cents: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_COOKIE = 'dm_currency'

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<SupportedCurrency>('CHF')
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        // Load persisted currency
        if (typeof window === 'undefined') return
        const saved = document.cookie
            .split('; ')
            .find((r) => r.startsWith(`${CURRENCY_COOKIE}=`))
        const value = saved?.split('=')[1] as SupportedCurrency
        if (value && SUPPORTED_CURRENCIES.includes(value)) {
            setCurrencyState(value)
        }
        setIsInitialized(true)
    }, [])

    function setCurrency(newCurrency: SupportedCurrency) {
        setCurrencyState(newCurrency)
        document.cookie = `${CURRENCY_COOKIE}=${newCurrency};path=/;max-age=${60 * 60 * 24 * 365}`
    }

    function format(cents: number) {
        const converted = convertPrice(cents, currency)
        return formatPrice(converted, currency)
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}
