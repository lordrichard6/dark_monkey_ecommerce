'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'
import type { HomeProduct } from '@/actions/products'
import { PackageOpen } from 'lucide-react'

type ProductGridProps = {
  products: HomeProduct[]
  title: string
  sort?: string
  hideHeader?: boolean
}

export function ProductGrid({
  products,
  title,
  sort = 'newest',
  hideHeader = false,
}: ProductGridProps) {
  const t = useTranslations('home')
  const router = useRouter()
  const searchParams = useSearchParams()

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
    <section>
      {!hideHeader && (
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
      )}

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
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
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
          <div className="mb-6 rounded-full bg-zinc-900 p-6 ring-1 ring-zinc-800">
            <PackageOpen className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-medium text-zinc-200">{t('comingSoonTitle')}</h3>
          <p className="mt-2 max-w-sm text-zinc-400">{t('comingSoonDescription')}</p>
        </div>
      )}
    </section>
  )
}
