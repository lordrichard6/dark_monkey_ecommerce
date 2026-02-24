'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecentlyViewed, trackProductView } from '@/lib/recommendations'
import { ProductCard } from './ProductCard'
import { useTranslations } from 'next-intl'
import { Product } from '@/types'

interface RecentlyViewedProps {
  userId?: string
  /** The current product ID — written to product_views on mount for RecentlyViewed tracking */
  productId?: string
}

export function RecentlyViewed({ userId, productId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const t = useTranslations('product')

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const sessionUserId = session?.user?.id

      // Track the current product view (fire-and-forget, non-critical)
      if (productId) {
        trackProductView(supabase, productId, sessionUserId || undefined, undefined).catch(() => {
          /* silently ignore tracking errors */
        })
      }

      // Load recently viewed (fetch one extra to account for filtering out current product)
      const viewedProducts = await getRecentlyViewed(
        supabase,
        userId,
        sessionUserId || undefined,
        5
      )

      // Exclude the product currently being viewed
      const filtered = productId ? viewedProducts.filter((p) => p.id !== productId) : viewedProducts

      setProducts(filtered.slice(0, 4))
      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, productId])

  if (loading || products.length === 0) return null

  return (
    <section className="mt-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">{t('recentlyViewed')}</h2>
        <p className="mt-2 text-zinc-400">{t('recentlyViewedSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard
            id={product.id}
            key={product.id}
            slug={product.slug}
            name={product.name}
            priceCents={product.price_cents || 0}
            imageUrl={
              (Array.isArray(product.product_images)
                ? (product.product_images[0] as any)?.url
                : undefined) || ''
            }
            imageAlt={product.name}
            fullProduct={product}
          />
        ))}
      </div>
    </section>
  )
}
