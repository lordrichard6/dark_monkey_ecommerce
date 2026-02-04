'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { ProductCardWithWishlist } from './ProductCardWithWishlist'

type Product = {
  productId?: string
  slug: string
  name: string
  priceCents: number
  imageUrl: string
  imageAlt: string
  isInWishlist?: boolean
  isBestseller?: boolean
}

type ProductGridProps = {
  products: Product[]
  title: string
  sort?: string
}

export function ProductGrid({ products, title, sort = 'newest' }: ProductGridProps) {
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
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCardWithWishlist
              key={product.slug}
              productId={product.productId!}
              slug={product.slug}
              name={product.name}
              priceCents={product.priceCents}
              imageUrl={product.imageUrl}
              imageAlt={product.imageAlt}
              isInWishlist={product.isInWishlist ?? false}
              isBestseller={product.isBestseller ?? false}
              showWishlist={!!product.productId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 py-24 text-center">
          <p className="text-zinc-500">
            {t('noProducts')}{' '}
            <code className="rounded bg-zinc-800 px-2 py-1 text-zinc-400">
              supabase db push
            </code>{' '}
            {t('noProductsHint')}
          </p>
        </div>
      )}
    </section>
  )
}
