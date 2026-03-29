import { createClient } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { getUserSafe } from '@/lib/supabase/server'
import { ProductGrid } from './ProductGrid'
import { getTranslations } from 'next-intl/server'

export async function FeaturedProductsSection() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  const [featuredResult, user, bestsellerIds] = await Promise.all([
    supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        dual_image_mode,
        product_images (url, alt, sort_order),
        product_variants (price_cents, compare_at_price_cents)
      `
      )
      .eq('is_active', true)
      .eq('is_featured', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    getUserSafe(supabase),
    getBestsellerProductIds(),
  ])

  const { data: products } = featuredResult

  // Don't render the section at all if no products are featured
  if (!products || products.length === 0) return null

  const wishlistProductIds = user?.id
    ? ((await supabase.from('user_wishlist').select('product_id').eq('user_id', user.id)).data?.map(
        (w) => w.product_id
      ) ?? [])
    : []

  const mapped = products.map((p) => {
    const variants = p.product_variants as
      | { price_cents: number; compare_at_price_cents: number | null }[]
      | null
    const images = p.product_images as
      | { url: string; alt: string | null; sort_order: number }[]
      | null

    let priceCents = 0
    let compareAtPriceCents: number | null = null

    if (variants && variants.length > 0) {
      const sorted = [...variants].sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0))
      priceCents = sorted[0].price_cents || 0
      compareAtPriceCents = sorted[0].compare_at_price_cents || null
    }

    const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) ?? []
    const primary = sortedImages[0]
    const second = sortedImages[1]

    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      priceCents,
      compareAtPriceCents,
      imageUrl: primary?.url ?? '',
      imageAlt: primary?.alt ?? p.name,
      imageUrl2: p.dual_image_mode ? (second?.url ?? null) : null,
      dualImageMode: p.dual_image_mode && !!second,
      isInWishlist: wishlistProductIds.includes(p.id),
      isBestseller: bestsellerIds.has(p.id),
    }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <ProductGrid products={mapped} title={t('featuredProducts')} hideHeader={false} />
    </div>
  )
}
