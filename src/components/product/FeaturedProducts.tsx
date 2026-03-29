import { createClient } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { getUserSafe } from '@/lib/supabase/server'
import { ProductGrid } from './ProductGrid'
import { getTranslations } from 'next-intl/server'

type Props = {
  sort?: string
  tag?: string
}

type ProductRow = {
  id: string
  name: string
  slug: string
  dual_image_mode: boolean
  product_images: { url: string; alt: string | null; sort_order: number }[] | null
  product_variants: { price_cents: number; compare_at_price_cents: number | null }[] | null
}

export async function FeaturedProducts({ sort = 'newest', tag }: Props) {
  const t = await getTranslations('home')
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      dual_image_mode,
      product_images (url, alt, sort_order),
      product_variants (price_cents, compare_at_price_cents),
      product_tags!inner (
        tags!inner (slug)
      )
    `
    )
    .eq('is_active', true)
    .is('deleted_at', null)

  if (tag) {
    query = query.eq('product_tags.tags.slug', tag)
  } else {
    // Try is_featured=true first; fall back to newest if none are set
    const { data: featuredData } = await supabase
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

    if (featuredData && featuredData.length > 0) {
      const [user, bestsellerIds] = await Promise.all([
        getUserSafe(supabase),
        getBestsellerProductIds(),
      ])
      const wishlistProductIds = user?.id
        ? ((
            await supabase.from('user_wishlist').select('product_id').eq('user_id', user.id)
          ).data?.map((w) => w.product_id) ?? [])
        : []

      const processed = mapProducts(featuredData as ProductRow[], wishlistProductIds, bestsellerIds)
      return <ProductGrid products={processed.slice(0, 8)} title={t('allProducts')} sort={sort} />
    }

    // No featured products — fall back to newest
    query = supabase
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
      .is('deleted_at', null)
  }

  query = query.order('created_at', { ascending: false })

  const [productsResult, user, bestsellerIds] = await Promise.all([
    query,
    getUserSafe(supabase),
    getBestsellerProductIds(),
  ])

  const { data: products } = productsResult

  const wishlistProductIds = user?.id
    ? ((await supabase.from('user_wishlist').select('product_id').eq('user_id', user.id)).data?.map(
        (w) => w.product_id
      ) ?? [])
    : []

  const productsWithPrice = mapProducts(
    (products ?? []) as ProductRow[],
    wishlistProductIds,
    bestsellerIds
  )

  const sortedProducts =
    sort === 'price-asc'
      ? [...productsWithPrice].sort((a, b) => a.priceCents - b.priceCents)
      : sort === 'price-desc'
        ? [...productsWithPrice].sort((a, b) => b.priceCents - a.priceCents)
        : productsWithPrice

  const displayedProducts = sortedProducts.slice(0, 8)

  return (
    <ProductGrid
      products={displayedProducts}
      title={tag ? `${t('discovery')}: ${tag}` : t('allProducts')}
      sort={sort}
    />
  )
}

function mapProducts(data: ProductRow[], wishlistProductIds: string[], bestsellerIds: Set<string>) {
  return data.map((p) => {
    const variants = p.product_variants
    const images = p.product_images

    let priceCents = 0
    let compareAtPriceCents: number | null = null

    if (variants && variants.length > 0) {
      const sortedVariants = [...variants].sort(
        (a, b) => (a.price_cents || 0) - (b.price_cents || 0)
      )
      const cheapest = sortedVariants[0]
      priceCents = cheapest.price_cents || 0
      compareAtPriceCents = cheapest.compare_at_price_cents || null
    }

    const sortedImages = images?.sort((a, b) => a.sort_order - b.sort_order) ?? []
    const primaryImage = sortedImages[0]
    const secondImage = sortedImages[1]

    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      priceCents,
      compareAtPriceCents,
      imageUrl: primaryImage?.url ?? '',
      imageAlt: primaryImage?.alt ?? p.name,
      imageUrl2: p.dual_image_mode ? (secondImage?.url ?? null) : null,
      dualImageMode: p.dual_image_mode && !!secondImage,
      isInWishlist: wishlistProductIds.includes(p.id),
      isBestseller: bestsellerIds.has(p.id),
    }
  })
}
