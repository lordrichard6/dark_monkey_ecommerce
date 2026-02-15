import { createClient } from '@/lib/supabase/server'
import { getRelatedProducts } from '@/lib/recommendations'
import { ProductCard } from './ProductCard'
import { getTranslations } from 'next-intl/server'

interface RelatedProductsProps {
    productId: string
    locale: string
}

export async function RelatedProducts({ productId, locale }: RelatedProductsProps) {
    const supabase = await createClient()
    const t = await getTranslations('product')

    const relatedProducts = await getRelatedProducts(supabase, productId, { limit: 4 })

    if (relatedProducts.length === 0) return null

    return (
        <section className="mt-20 border-t border-white/5 pt-16">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        {t('relatedProducts')}
                    </h2>
                    <p className="mt-2 text-zinc-400">
                        {t('relatedProductsSubtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {relatedProducts.map((product) => (
                    <ProductCard
                        id={product.id}
                        key={product.id}
                        slug={product.slug}
                        name={product.name}
                        priceCents={product.price_cents || 0}
                        imageUrl={Array.isArray(product.product_images) ? (product.product_images[0] as any)?.url : ''}
                        imageAlt={product.name}
                        fullProduct={product as any}
                    />
                ))}
            </div>
        </section>
    )
}
