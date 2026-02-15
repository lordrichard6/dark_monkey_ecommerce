import { SupabaseClient } from '@supabase/supabase-js'
import { Product } from '@/types'

export type RecommendationType = 'related' | 'frequently_bought' | 'recently_viewed'

export interface RecommendationOptions {
    limit?: number
    excludeId?: string
}

/**
 * Get related products based on category and tags
 */
export async function getRelatedProducts(
    supabase: SupabaseClient,
    productId: string,
    options: RecommendationOptions = {}
): Promise<Product[]> {
    const { limit = 4, excludeId } = options

    // 1. Get current product info
    const { data: currentProduct } = await supabase
        .from('products')
        .select('category_id, tags')
        .eq('id', productId)
        .single()

    if (!currentProduct) return []

    // 2. Fetch products in same category or with matching tags
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .or(`category_id.eq.${currentProduct.category_id},tags.ov.{${currentProduct.tags?.join(',') || ''}}`)
        .neq('id', productId)
        .eq('is_active', true)
        .limit(limit * 2)

    if (!products) return []

    // 3. Score and sort by relevance
    const scoredProducts = products.map((p) => {
        let score = 0
        if (p.category_id === currentProduct.category_id) score += 5

        // Count matching tags
        const matchingTags = p.tags?.filter((tag: string) => currentProduct.tags?.includes(tag)) || []
        score += matchingTags.length * 2

        return { ...p, relevanceScore: score }
    })

    return scoredProducts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit) as unknown as Product[]
}

/**
 * Get products frequently bought together based on historic order data
 */
export async function getFrequentlyBoughtTogether(
    supabase: SupabaseClient,
    productId: string,
    limit: number = 4
): Promise<Product[]> {
    // Query product_associations table join with products
    const { data: associations } = await supabase
        .from('product_associations')
        .select(`
      product_b_id,
      frequency,
      products!product_associations_product_b_id_fkey (*)
    `)
        .eq('product_a_id', productId)
        .eq('products.is_active', true)
        .order('frequency', { ascending: false })
        .limit(limit)

    if (!associations) return []

    return associations.map((a: any) => a.products) as unknown as Product[]
}

/**
 * Track a product view for a user or session
 */
export async function trackProductView(
    supabase: SupabaseClient,
    productId: string,
    userId?: string,
    sessionId?: string
) {
    await supabase.from('product_views').insert({
        product_id: productId,
        user_id: userId || null,
        session_id: sessionId || null,
    })
}

/**
 * Get recently viewed products
 */
export async function getRecentlyViewed(
    supabase: SupabaseClient,
    userId?: string,
    sessionId?: string,
    limit: number = 4
): Promise<Product[]> {
    let query = supabase
        .from('product_views')
        .select('*, products(*)')
        .eq('products.is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit * 3)

    if (userId) {
        query = query.eq('user_id', userId)
    } else if (sessionId) {
        query = query.eq('session_id', sessionId)
    } else {
        return []
    }

    const { data: views } = await query

    if (!views) return []

    const seen = new Set()
    const products: Product[] = []

    for (const view of views) {
        if (view.products && !seen.has((view.products as any).id)) {
            seen.add((view.products as any).id)
            products.push(view.products as unknown as Product)
        }
        if (products.length >= limit) break
    }

    return products
}
