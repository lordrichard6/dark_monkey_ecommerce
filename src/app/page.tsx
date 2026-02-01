import { Suspense } from 'react'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { Hero } from '@/components/Hero'
import { ProductGrid } from '@/components/product/ProductGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  description:
    'Premium gamified e-commerce — commerce, customization, and progression. Browse our collection.',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort = 'newest' } = await searchParams

  let productsWithPrice: Array<{
    productId: string
    slug: string
    name: string
    priceCents: number
    imageUrl: string
    imageAlt: string
    isInWishlist: boolean
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

    const [productsResult, user] = await Promise.all([
      query,
      getUserSafe(supabase),
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
    }
    })
  } catch {
    productsWithPrice = []
  }

  // Sort by price on client (Supabase doesn't support ordering by joined table easily)
  const sortedProducts =
    sort === 'price-asc'
      ? [...productsWithPrice].sort((a, b) => a.priceCents - b.priceCents)
      : sort === 'price-desc'
        ? [...productsWithPrice].sort((a, b) => b.priceCents - a.priceCents)
        : productsWithPrice

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <Hero />
      <div id="products" className="mx-auto max-w-6xl px-4 py-8 scroll-mt-4">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-900" />}>
          <ProductGrid
            products={sortedProducts}
            title="Featured products"
            sort={sort}
          />
        </Suspense>
      </div>
    </div>
  )
}
