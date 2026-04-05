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
    <section className="bg-zinc-950 py-24 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] -z-10" />
      <div className="mx-auto max-w-6xl px-4">
        <ProductGrid products={products} title={t('featuredProducts')} hideHeader={false} />
      </div>
    </section>
  )
}
