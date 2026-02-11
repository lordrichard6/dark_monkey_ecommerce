'use client'

import { useState, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'
import { CATEGORIES } from '@/lib/categories'
import { useTranslations } from 'next-intl'
import { ChevronRight, ChevronLeft } from 'lucide-react'

type Product = {
    productId: string
    slug: string
    name: string
    priceCents: number
    compareAtPriceCents?: number | null
    imageUrl: string
    imageAlt: string
    isInWishlist: boolean
    isBestseller: boolean
    categoryId?: string
}

type Props = {
    products: Product[]
}

export function NewArrivals({ products }: Props) {
    const t = useTranslations('home')
    const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.categoryId === activeCategory || (CATEGORIES.find(c => c.id === activeCategory)?.subcategories?.some(s => s.id === p.categoryId)))

    // Limit to 8 items for homepage display
    const displayedProducts = filteredProducts.slice(0, 8)
    const hasMore = filteredProducts.length > 8

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0))
        setScrollLeft(scrollRef.current?.scrollLeft || 0)
    }

    const handleMouseLeave = () => {
        setIsDragging(false)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0)
        const walk = (x - startX) * 2
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft - walk
        }
    }

    return (
        <section className="bg-zinc-950 py-24 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] -z-10" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
                    <div className="w-full overflow-hidden">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 font-serif lowercase italic">
                            New arrivals
                        </h2>
                        {/* Scrollable Tabs for Mobile */}
                        <div className="mt-4 md:mt-6 flex gap-6 md:gap-8 items-center border-b border-white/5 pb-2 md:pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`text-xs md:text-sm font-semibold uppercase tracking-widest transition-all relative py-2 white-nowrap flex-shrink-0 ${activeCategory === 'all' ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                All
                                {activeCategory === 'all' && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-50" />
                                )}
                            </button>
                            {CATEGORIES.slice(0, 4).map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`text-xs md:text-sm font-semibold uppercase tracking-widest transition-all relative py-2 whitespace-nowrap flex-shrink-0 ${activeCategory === cat.id ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {cat.name.replace("'s clothing", "s")}
                                    {activeCategory === cat.id && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-50" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex gap-2">
                        <button
                            onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                            className="p-3 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                            className="p-3 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`grid grid-cols-2 gap-4 md:flex md:gap-6 overflow-x-auto pb-8 md:pb-12 md:[&::-webkit-scrollbar]:hidden md:[ms-overflow-style:none] md:[scrollbar-width:none] md:cursor-grab md:active:cursor-grabbing md:select-none md:scroll-smooth ${isDragging ? 'md:scroll-auto' : ''}`}
                >
                    {displayedProducts.length > 0 ? (
                        displayedProducts.map((product) => (
                            <div key={product.slug} className="md:min-w-[320px] flex-shrink-0 transition-transform hover:-translate-y-1">
                                <ProductCardWithWishlist
                                    productId={product.productId}
                                    slug={product.slug}
                                    name={product.name}
                                    priceCents={product.priceCents}
                                    compareAtPriceCents={product.compareAtPriceCents}
                                    imageUrl={product.imageUrl}
                                    imageAlt={product.imageAlt}
                                    isInWishlist={product.isInWishlist}
                                    isBestseller={product.isBestseller}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 w-full py-12 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl">
                            No new arrivals in this category yet.
                        </div>
                    )}
                </div>

                {hasMore && (
                    <div className="mt-8 text-center">
                        <Link
                            href="/categories"
                            className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-8 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-zinc-50"
                        >
                            {t('seeAllNewArrivals')}
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    )
}
