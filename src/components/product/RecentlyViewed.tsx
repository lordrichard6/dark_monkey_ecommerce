'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecentlyViewed } from '@/lib/recommendations'
import { ProductCard } from './ProductCard'
import { useTranslations } from 'next-intl'
import { Product } from '@/types'

interface RecentlyViewedProps {
    userId?: string
}

export function RecentlyViewed({ userId }: RecentlyViewedProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const t = useTranslations('product')

    useEffect(() => {
        async function loadRecentlyViewed() {
            // For now, we use either userId or a session-based approach
            // If no userId, we could look into localStorage but the engine expects a session_id in the DB
            const { data: { session } } = await supabase.auth.getSession()

            const viewedProducts = await getRecentlyViewed(
                supabase,
                userId,
                session?.user?.id || undefined, // Fallback to session user
                4
            )

            setProducts(viewedProducts)
            setLoading(false)
        }

        loadRecentlyViewed()
    }, [userId, supabase])

    if (loading || products.length === 0) return null

    return (
        <section className="mt-20">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">
                    {t('recentlyViewed')}
                </h2>
                <p className="mt-2 text-zinc-400">
                    {t('recentlyViewedSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                    <ProductCard
                        id={product.id}
                        key={product.id}
                        slug={product.slug}
                        name={product.name}
                        priceCents={product.price_cents || 0}
                        imageUrl={Array.isArray(product.product_images) ? (product.product_images[0] as any)?.url : ''}
                        imageAlt={product.name}
                        fullProduct={product}
                    />
                ))}
            </div>
        </section>
    )
}
