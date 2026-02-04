import { Suspense } from 'react'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { Hero } from '@/components/Hero'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ sort?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('home')
  return {
    description: t('metaDescription'),
  }
}

export default async function HomePage({ params, searchParams }: Props) {
  const { sort = 'newest' } = await searchParams

  let productsWithPrice: Array<{
    productId: string
    slug: string
    name: string
    priceCents: number
    imageUrl: string
    imageAlt: string
    isInWishlist: boolean
    isBestseller?: boolean
  }> = []

  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        product_images (url, alt, sort_order),
        product_variants (price_cents)
      `
      )
      .eq('is_active', true)

    if (sort === 'price-asc') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'price-desc') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const [productsResult, user, bestsellerIds] = await Promise.all([
      query,
      getUserSafe(supabase),
      getBestsellerProductIds(),
    ])
    const { data: products } = productsResult

    const wishlistProductIds = user?.id
      ? (
        await supabase
          .from('user_wishlist')
          .select('product_id')
          .eq('user_id', user.id)
      ).data?.map((w) => w.product_id) ?? []
      : []

    productsWithPrice = (products ?? []).map((p) => {
      const variants = p.product_variants as { price_cents: number }[] | null
      const images = p.product_images as { url: string; alt: string | null; sort_order: number }[] | null
      const minPrice = variants?.length
        ? Math.min(...variants.map((v) => v.price_cents))
        : 0
      const primaryImage = images?.sort((a, b) => a.sort_order - b.sort_order)[0]
      return {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        priceCents: minPrice,
        imageUrl: primaryImage?.url ?? '/next.svg',
        imageAlt: primaryImage?.alt ?? p.name,
        isInWishlist: wishlistProductIds.includes(p.id),
        isBestseller: bestsellerIds.has(p.id),
      }
    })
  } catch {
    productsWithPrice = []
  }

  const sortedProducts =
    sort === 'price-asc'
      ? [...productsWithPrice].sort((a, b) => a.priceCents - b.priceCents)
      : sort === 'price-desc'
        ? [...productsWithPrice].sort((a, b) => b.priceCents - a.priceCents)
        : productsWithPrice

  const t = await getTranslations('home')

  return (
    <div>
      <Hero />
      <div id="products" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-4">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-900" />}>
          <ProductGrid
            products={sortedProducts}
            title={t('featuredProducts')}
            sort={sort}
          />
        </Suspense>
      </div>
    </div>
  )
}
