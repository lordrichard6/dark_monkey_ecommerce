'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ProductImageWithFallback } from './ProductImageWithFallback'
import { ShoppingCart } from 'lucide-react'
import { useCurrency } from '@/components/currency/CurrencyContext'

type StickyAddToCartProps = {
    productName: string
    priceCents: number
    imageUrl: string
    stock: number
}

export function StickyAddToCart({ productName, priceCents, imageUrl, stock }: StickyAddToCartProps) {
    const [isVisible, setIsVisible] = useState(false)
    const t = useTranslations('product')
    const { format } = useCurrency()

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 600px (past the initial fold)
            if (window.scrollY > 600) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (!isVisible) return null

    const scrollToSelection = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="fixed bottom-0 left-0 z-40 w-full border-t border-zinc-700 bg-zinc-900/95 p-4 backdrop-blur-md transition-transform md:hidden">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-700">
                        <ProductImageWithFallback
                            src={imageUrl}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                        />
                    </div>
                    <div className="truncate">
                        <p className="truncate text-sm font-semibold text-white">{productName}</p>
                        <p className="text-sm font-medium text-amber-400">{format(priceCents)}</p>
                    </div>
                </div>
                <button
                    onClick={scrollToSelection}
                    disabled={stock === 0}
                    className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                    <ShoppingCart className="h-4 w-4" />
                    {stock === 0 ? t('outOfStock') : t('addToCart')}
                </button>
            </div>
        </div>
    )
}
