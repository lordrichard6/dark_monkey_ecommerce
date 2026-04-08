'use client'

import { useState, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'
import type { HomeProduct } from '@/actions/products'
type Category = { id: string; name: string; slug: string; subcategories?: { id: string }[] }
import { useTranslations } from 'next-intl'
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

type Props = {
  products: HomeProduct[]
  categories: Category[]
}

export function NewArrivals({ products, categories }: Props) {
  const t = useTranslations('home')
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter(
          (p) =>
            p.categoryId === activeCategory ||
            categories
              .find((c) => c.id === activeCategory)
              ?.subcategories?.some((s) => s.id === p.categoryId)
        )

  const displayedProducts = filteredProducts.slice(0, 8)
  const hasMore = filteredProducts.length > 8

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0))
    setScrollLeft(scrollRef.current?.scrollLeft || 0)
  }

  const handleMouseLeave = () => setIsDragging(false)
  const handleMouseUp = () => setIsDragging(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk
  }

  const categorySlugKeyMap: Record<string, string> = {
    'mens-clothing': 'categoryMens',
    'womens-clothing': 'categoryWomens',
    'kids-youth-clothing': 'categoryKids',
    hats: 'categoryHats',
    accessories: 'categoryAccessories',
    'home-living': 'categoryHome',
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <ScrollReveal className="w-full md:flex-1 overflow-hidden">
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              {t('newArrivals')}
            </span>

            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 font-serif lowercase italic">
              {t('newArrivals')}
            </h2>

            {/* Category filter pills */}
            <div className="mt-5 flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory('all')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  activeCategory === 'all'
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                }`}
              >
                {t('all')}
              </button>
              {categories.slice(0, 6).map((cat) => {
                const key = categorySlugKeyMap[cat.slug]
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      activeCategory === cat.id
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                    }`}
                  >
                    {key ? t(key) : cat.name}
                  </button>
                )
              })}
            </div>
          </ScrollReveal>

          {/* Scroll chevrons */}
          <div className="hidden md:flex gap-2 pt-1 shrink-0">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="p-3 rounded-full border border-white/10 text-zinc-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white hover:border-white/20 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="p-3 rounded-full border border-white/10 text-zinc-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white hover:border-white/20 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Product scroll track */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`grid grid-cols-2 gap-3 sm:gap-4 md:flex md:gap-6 overflow-x-auto pb-8 md:pb-12 md:[&::-webkit-scrollbar]:hidden md:[ms-overflow-style:none] md:[scrollbar-width:none] md:cursor-grab md:active:cursor-grabbing md:select-none md:scroll-smooth ${isDragging ? 'md:scroll-auto' : ''}`}
        >
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product, i) => (
              <div
                key={product.slug}
                className="md:min-w-[280px] md:w-[280px] flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"
              >
                <ProductCardWithWishlist
                  index={i}
                  productId={product.productId}
                  slug={product.slug}
                  name={product.name}
                  priceCents={product.priceCents}
                  compareAtPriceCents={product.compareAtPriceCents}
                  imageUrl={product.imageUrl}
                  imageAlt={product.imageAlt}
                  imageUrl2={product.imageUrl2}
                  dualImageMode={product.dualImageMode}
                  isInWishlist={product.isInWishlist}
                  isBestseller={product.isBestseller}
                  isOnSale={product.isOnSale}
                  upvotes={product.upvotes}
                  publicUp={product.publicUp}
                  publicDown={product.publicDown}
                  timesBought={product.timesBought}
                  reviewCount={product.reviewCount}
                  avgRating={product.avgRating}
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 w-full py-12 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl">
              {t('noNewArrivals')}
            </div>
          )}
        </div>

        {/* View all — button-in-button */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/products"
              className="group inline-flex items-center justify-between rounded-full border border-white/15 bg-white/5 py-2 pl-7 pr-2 text-sm font-semibold text-zinc-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/30 hover:bg-white/10 active:scale-[0.97]"
            >
              <span className="pr-4">{t('seeAllNewArrivals')}</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
