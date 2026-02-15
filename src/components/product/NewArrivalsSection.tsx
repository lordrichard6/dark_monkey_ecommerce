import { createClient } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { getUserSafe } from '@/lib/supabase/server'
import { NewArrivals } from './NewArrivals'

export async function NewArrivalsSection() {
    const supabase = await createClient()

    const [newArrivalsResult, user, bestsellerIds] = await Promise.all([
        supabase
            .from('products')
            .select(`
        id,
        name,
        slug,
        category_id,
        product_images (url, alt, sort_order),
        product_variants (price_cents, compare_at_price_cents)
      `)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(10),
        getUserSafe(supabase),
        getBestsellerProductIds(),
    ])

    const { data: newArrivalsData } = newArrivalsResult

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
            isBestseller: bestsellerIds.has(p.id),
            categoryId: p.category_id
        }
    })

    const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')

    // Build category tree
    const categoriesMap = new Map()
    const rootCategories: any[] = []

    if (categoriesData) {
        // First pass: create nodes
        categoriesData.forEach(cat => {
            categoriesMap.set(cat.id, { ...cat, subcategories: [] })
        })

        // Second pass: build tree
        categoriesData.forEach(cat => {
            if (cat.parent_id) {
                const parent = categoriesMap.get(cat.parent_id)
                if (parent) {
                    parent.subcategories.push(categoriesMap.get(cat.id))
                }
            } else {
                rootCategories.push(categoriesMap.get(cat.id))
            }
        })
    }

    const newArrivals = processProducts(newArrivalsData ?? [])

    return <NewArrivals products={newArrivals} categories={rootCategories} />
}
