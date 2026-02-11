'use client'

import { useCurrency } from '@/components/currency/CurrencyContext'
import type { SupportedCurrency } from '@/lib/currency'

type PriceProps = {
    /**
     * Price in CHF cents (base currency)
     */
    cents: number

    /**
     * Optional CSS class
     */
    className?: string

    /**
     * Show "from" prefix for variable pricing
     */
    showFrom?: boolean

    /**
     * Show original price (for comparison/sale display)
     */
    originalCents?: number
}

export function Price({ cents, className = '', showFrom = false, originalCents }: PriceProps) {
    const { format } = useCurrency()

    return (
        <div className={`flex items-baseline gap-2 ${className}`}>
            {showFrom && <span className="text-sm opacity-70">from</span>}

            {/* Sale Price or Regular Price */}
            <span className={originalCents ? 'font-bold text-green-400' : 'font-bold'}>
                {format(cents)}
            </span>

            {/* Original Price (crossed out) */}
            {originalCents && (
                <span className="text-sm line-through opacity-50">
                    {format(originalCents)}
                </span>
            )}
        </div>
    )
}

/**
 * Simplified inline price display
 */
export function InlinePrice({ cents }: { cents: number }) {
    const { format } = useCurrency()
    return <>{format(cents)}</>
}
