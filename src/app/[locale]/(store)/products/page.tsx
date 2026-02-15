import { createClient } from '@/lib/supabase/server'
import { searchProducts, type SearchableProduct } from '@/lib/search'
import { SearchResults } from '@/components/search/SearchResults'
import { type FilterableProduct } from '@/lib/product-filtering'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('common')
    return {
        title: t('products'),
        description: t('browseProducts'),
    }
}

export default async function ProductsPage() {
    const t = await getTranslations('search')
    const tCommon = await getTranslations('common')
    const supabase = await createClient()

    // Fetch all active products
    const { data: products, error } = await supabase
        .from('products')
        .select(
            `
      id,
      name,
      slug,
      description,
      category_id,
      created_at,
      categories (id, name, slug),
      product_images (url, alt, sort_order),
      product_variants (
        price_cents,
        product_inventory (quantity),
        product_attributes (
          attribute_values (value, attributes (name))
        )
      )
    `
        )
        .eq('is_active', true)
        .is('deleted_at', null)

    if (error || !products) {
        return (
            <div className="min-h-[calc(100vh-3.5rem)]">
                <div className="mx-auto max-w-6xl px-4 py-16 text-center">
                    <h1 className="mb-4 text-2xl font-bold text-zinc-50">
                        {tCommon('error')}
                    </h1>
                    <p className="text-zinc-400">{t('errorMessage')}</p>
                </div>
            </div>
        )
    }

    // Transform products
    const searchableProducts: SearchableProduct[] = []
    const filterableProducts: FilterableProduct[] = []
    const categoryMap = new Map<string, { id: string; name: string; count: number }>()

    for (const p of products) {
        // ... transformation logic identical to search page ...
        const variants = p.product_variants as any[]
        const images = p.product_images as any[]
        const category = Array.isArray(p.categories) ? p.categories[0] : p.categories

        const minPrice = variants?.length
            ? Math.min(...variants.map((v: any) => v.price_cents))
            : 0

        const sortedImages = images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
        const primaryImage = sortedImages[0]

        const colors = new Set<string>()
        const sizes = new Set<string>()
        let totalStock = 0

        if (variants) {
            for (const variant of variants) {
                const inventory = variant.product_inventory
                if (inventory) {
                    const qty = Array.isArray(inventory)
                        ? inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
                        : inventory.quantity
                    totalStock += qty
                }

                if (variant.product_attributes) {
                    for (const prodAttr of variant.product_attributes) {
                        if (prodAttr.attribute_values && prodAttr.attribute_values.length > 0) {
                            const attrVal = prodAttr.attribute_values[0]
                            if (attrVal.attributes && attrVal.attributes.length > 0) {
                                const attrName = attrVal.attributes[0].name.toLowerCase()
                                const attrValue = attrVal.value
                                if (attrName === 'color' || attrName === 'colour') colors.add(attrValue)
                                else if (attrName === 'size') sizes.add(attrValue)
                            }
                        }
                    }
                }
            }
        }

        filterableProducts.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            priceCents: minPrice,
            categoryId: p.category_id,
            categoryName: category?.name || null,
            colors: Array.from(colors),
            sizes: Array.from(sizes),
            inStock: totalStock > 0,
            createdAt: p.created_at,
            isBestseller: false,
            averageRating: undefined,
        })

        if (category) {
            const existing = categoryMap.get(category.id)
            if (existing) {
                existing.count++
            } else {
                categoryMap.set(category.id, {
                    id: category.id,
                    name: category.name,
                    count: 1,
                })
            }
        }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    )

    return (
        <div className="min-h-[calc(100vh-3.5rem)]">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <nav className="mb-8 text-sm text-zinc-500">
                    <Link href="/" className="hover:text-zinc-300">
                        {tCommon('shop')}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-zinc-400">{tCommon('products')}</span>
                </nav>

                <SearchResults
                    products={filterableProducts}
                    categories={categories}
                    title={tCommon('allProducts')}
                />
            </div>
        </div>
    )
}
