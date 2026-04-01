'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { fetchHomeProducts, type HomeProduct } from '@/actions/products'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { ChevronDown, Search, X, ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from '@/i18n/navigation'

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
      {/* Tag filter pills */}
      {tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTagClick(undefined)}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
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
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    dropdownOpen || selectedInHidden
                      ? 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {selectedInHidden ? t('tagFilterActive') : `+${remainingCount} more`}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
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
                        <p className="py-4 text-center text-xs text-zinc-600">{t('tagNoTagsFound')}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 p-1">
                          {filteredHidden.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleTagClick(tag.slug)}
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
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

      {/* Header: title + sort */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">{title}</h2>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>

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

      {/* View All CTA */}
      {!isPending && products.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2.5 rounded-full border border-zinc-700 bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-zinc-300 transition-all hover:border-amber-500/50 hover:bg-zinc-800 hover:text-amber-400"
          >
            {t('seeAllProducts')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </section>
  )
}
