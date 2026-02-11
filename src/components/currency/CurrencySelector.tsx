'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'
import type { SupportedCurrency } from '@/lib/currency'
import { CURRENCY_INFO } from '@/lib/currency'

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSelect = (newCurrency: SupportedCurrency) => {
        if (newCurrency !== currency) {
            setCurrency(newCurrency)
        }
        setIsOpen(false)
    }

    const currentCurrency = CURRENCY_INFO[currency]

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-sm"
                aria-label="Select currency"
                aria-expanded={isOpen}
            >
                <span className="text-lg" aria-hidden="true">{currentCurrency.flag}</span>
                <span className="font-medium">{currentCurrency.code}</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                        {Object.values(CURRENCY_INFO).map((currencyInfo) => (
                            <button
                                key={currencyInfo.code}
                                onClick={() => handleSelect(currencyInfo.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${currency === currencyInfo.code
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-300 hover:bg-zinc-800/50'
                                    }`}
                            >
                                <span className="text-xl" aria-hidden="true">{currencyInfo.flag}</span>
                                <div className="flex-1">
                                    <div className="font-medium">{currencyInfo.code}</div>
                                    <div className="text-xs text-zinc-400">{currencyInfo.name}</div>
                                </div>
                                {currency === currencyInfo.code && (
                                    <svg
                                        className="w-5 h-5 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
