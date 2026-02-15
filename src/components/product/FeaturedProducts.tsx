import { createClient } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { getUserSafe } from '@/lib/supabase/server'
import { ProductGrid } from './ProductGrid'
import { getTranslations } from 'next-intl/server'

type Props = {
    sort?: string
    tag?: string
}

export async function FeaturedProducts({ sort = 'newest', tag }: Props) {
    const t = await getTranslations('home')
    const supabase = await createClient()

    let query = supabase
        .from('products')
        .select(
            `
      id,
      name,
      slug,
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
        query = supabase
            .from('products')
            .select(
                `
        id,
        name,
        slug,
        product_images (url, alt, sort_order),
        product_variants (price_cents, compare_at_price_cents)
      `
            )
            .eq('is_active', true)
            .is('deleted_at', null) as any
    }

    query = query.order('created_at', { ascending: false })

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

    const processProducts = (data: any[]) => data.map((p) => {
        const variants = p.product_variants as { price_cents: number; compare_at_price_cents: number | null }[] | null
        const images = p.product_images as { url: string; alt: string | null; sort_order: number }[] | null

        let priceCents = 0
        let compareAtPriceCents: number | null = null

        if (variants && variants.length > 0) {
            const sortedVariants = [...variants].sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0))
            const cheapest = sortedVariants[0]
            priceCents = cheapest.price_cents || 0
            compareAtPriceCents = cheapest.compare_at_price_cents || null
        }

        const primaryImage = images?.sort((a, b) => a.sort_order - b.sort_order)[0]
        return {
            productId: p.id,
            slug: p.slug,
            name: p.name,
            priceCents,
            compareAtPriceCents,
            imageUrl: primaryImage?.url ?? '/next.svg',
            imageAlt: primaryImage?.alt ?? p.name,
            isInWishlist: wishlistProductIds.includes(p.id),
            isBestseller: bestsellerIds.has(p.id)
        }
    })

    let productsWithPrice = processProducts(products ?? [])

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
            title={tag ? `${t('discovery')}: ${tag}` : t('featuredProducts')}
            sort={sort}
        />
    )
}
