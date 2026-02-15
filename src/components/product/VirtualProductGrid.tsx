'use client'

import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState, useEffect } from 'react'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'
import { PackageOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'

type Product = {
    productId?: string
    slug: string
    name: string
    priceCents: number
    compareAtPriceCents?: number | null
    imageUrl: string
    imageAlt: string
    isInWishlist?: boolean
    isBestseller?: boolean
}

type VirtualProductGridProps = {
    products: Product[]
    title: string
    sort?: string
}

export function VirtualProductGrid({ products, title, sort = 'newest' }: VirtualProductGridProps) {
    const t = useTranslations('home')
    const router = useRouter()
    const searchParams = useSearchParams()
    const listRef = useRef<HTMLDivElement>(null)
    const [columns, setColumns] = useState(4)

    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth >= 1024) setColumns(4)
            else if (window.innerWidth >= 768) setColumns(3)
            else setColumns(2)
        }
        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    // Calculate rows
    const rowCount = Math.ceil(products.length / columns)

    const virtualizer = useWindowVirtualizer({
        count: rowCount,
        estimateSize: () => 500, // Estimate height of a product card + gap
        overscan: 5,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    })

    const SORT_OPTIONS = [
        { value: 'newest', label: t('sortNewest') },
        { value: 'price-asc', label: t('sortPriceAsc') },
        { value: 'price-desc', label: t('sortPriceDesc') },
    ] as const

    function handleSortChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'newest') {
            params.delete('sort')
        } else {
            params.set('sort', value)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <section ref={listRef}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">{title}</h2>
                {products.length > 0 && (
                    <select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {products.length > 0 ? (
                <div
                    className="relative w-full"
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const rowStartIndex = virtualRow.index * columns
                        const rowProducts = products.slice(rowStartIndex, rowStartIndex + columns)

                        return (
                            <div
                                key={virtualRow.key}
                                className="absolute left-0 top-0 grid w-full grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
                                style={{
                                    transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                                }}
                            >
                                {rowProducts.map((product) => (
                                    <ProductCardWithWishlist
                                        key={product.slug}
                                        productId={product.productId!}
                                        slug={product.slug}
                                        name={product.name}
                                        priceCents={product.priceCents}
                                        compareAtPriceCents={product.compareAtPriceCents}
                                        imageUrl={product.imageUrl}
                                        imageAlt={product.imageAlt}
                                        isInWishlist={product.isInWishlist ?? false}
                                        isBestseller={product.isBestseller ?? false}
                                        showWishlist={!!product.productId}
                                    />
                                ))}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
                    <div className="mb-6 rounded-full bg-zinc-900 p-6 ring-1 ring-zinc-800">
                        <PackageOpen className="h-10 w-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-medium text-zinc-200">
                        {t.has('comingSoonTitle') ? t('comingSoonTitle') : 'We are preparing our products'}
                    </h3>
                    <p className="mt-2 max-w-sm text-zinc-400">
                        {t.has('comingSoonDescription') ? t('comingSoonDescription') : 'We are currently updating our collection. Please check back soon!'}
                    </p>
                </div>
            )}
        </section>
    )
}
