import { fetchHomeProducts } from '@/actions/products'
import { ProductGrid } from './ProductGrid'
import { getTranslations } from 'next-intl/server'

export async function FeaturedProductsSection() {
  const [products, t] = await Promise.all([
    fetchHomeProducts({ featured: true, limit: 8 }),
    getTranslations('home'),
  ])

  // Don't render the section at all if no products are featured
  if (products.length === 0) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <ProductGrid products={products} title={t('featuredProducts')} hideHeader={false} />
    </div>
  )
}
