'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { fetchHomeProducts, type HomeProduct } from '@/actions/products'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { ChevronDown, Search, X, ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

type Tag = { id: string; name: string; slug: string }

type Props = {
  initialProducts: HomeProduct[]
  tags: Tag[]
}

const VISIBLE_COUNT = 8

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'price-asc', labelKey: 'sortPriceAsc' },
  { value: 'price-desc', labelKey: 'sortPriceDesc' },
] as const

export function AllProductsSection({ initialProducts, tags }: Props) {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  const [sort, setSort] = useState<string>('newest')
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined)
  const [products, setProducts] = useState<HomeProduct[]>(initialProducts)
  const [isPending, startTransition] = useTransition()

  // Tag filter dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function applyFilters(newSort: string, newTag: string | undefined) {
    startTransition(async () => {
      const result = await fetchHomeProducts(newSort, newTag)
      setProducts(result)
    })
  }

  function handleSortChange(value: string) {
    setSort(value)
    applyFilters(value, selectedTag)
  }

  function handleTagClick(slug: string | undefined) {
    setSelectedTag(slug)
    setDropdownOpen(false)
    setSearch('')
    applyFilters(sort, slug)
  }

  const visibleTags = tags.slice(0, VISIBLE_COUNT)
  const hiddenTags = tags.slice(VISIBLE_COUNT)
  const remainingCount = hiddenTags.length
  const selectedInHidden = selectedTag && hiddenTags.some((t) => t.slug === selectedTag)
  const selectedTagObj = selectedInHidden ? tags.find((t) => t.slug === selectedTag) : null
  const filteredHidden = search.trim()
    ? hiddenTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : hiddenTags

  const title = selectedTag
    ? `${t('discovery')}: ${tags.find((tg) => tg.slug === selectedTag)?.name ?? selectedTag}`
    : tCommon('allProducts')

  return (
    <section>
      {/* Section eyebrow + sort pills */}
      <ScrollReveal>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              {tCommon('allProducts')}
            </span>
            <h2 className="mt-3 text-2xl font-bold text-zinc-50 md:text-3xl">{title}</h2>
          </div>

          {/* Custom sort pill group */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  sort === opt.value
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Tag filter pills */}
      {tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTagClick(undefined)}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                !selectedTag
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {t('tagAllProducts')}
            </button>

            {visibleTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.slug)}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  selectedTag === tag.slug
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {tag.name}
              </button>
            ))}

            {selectedTagObj && (
              <button
                onClick={() => handleTagClick(undefined)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-medium text-zinc-950 shadow-lg shadow-amber-500/20"
              >
                {selectedTagObj.name}
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {remainingCount > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    dropdownOpen || selectedInHidden
                      ? 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {selectedInHidden ? t('tagFilterActive') : `+${remainingCount} more`}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
                    <div className="border-b border-zinc-800 p-2">
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
                        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <input
                          autoFocus
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t('tagSearchPlaceholder')}
                          className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none"
                        />
                        {search && (
                          <button onClick={() => setSearch('')}>
                            <X className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {filteredHidden.length === 0 ? (
                        <p className="py-4 text-center text-xs text-zinc-600">
                          {t('tagNoTagsFound')}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 p-1">
                          {filteredHidden.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleTagClick(tag.slug)}
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                selectedTag === tag.slug
                                  ? 'bg-amber-500 text-zinc-950'
                                  : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                              }`}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {isPending ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((product, i) => (
            <ProductCardWithWishlist
              key={product.slug}
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
          ))}
        </div>
      )}

      {/* View All CTA — button-in-button */}
      {!isPending && products.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Link
            href="/products"
            className="group inline-flex items-center justify-between rounded-full border border-white/15 bg-white/5 py-2 pl-7 pr-2 text-sm font-semibold text-zinc-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-amber-500/30 hover:bg-zinc-800/60 hover:text-amber-400 active:scale-[0.97]"
          >
            <span className="pr-4">{t('seeAllProducts')}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 group-hover:text-amber-400">
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      )}
    </section>
  )
}
