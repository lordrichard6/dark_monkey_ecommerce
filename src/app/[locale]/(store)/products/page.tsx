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

type Props = {
    searchParams: Promise<{ category?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
    const { category: selectedCategorySlug } = await searchParams
    const t = await getTranslations('search')
    const tCommon = await getTranslations('common')
    const tStore = await getTranslations('store')
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
        id,
        price_cents,
        attributes,
        product_inventory (quantity)
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
    const filterableProducts: FilterableProduct[] = []
    const categoryMap = new Map<string, { id: string; name: string; count: number; slug: string }>()

    for (const p of products) {
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

                const attrs = variant.attributes || {}
                const color = attrs.color || attrs.colour
                const size = attrs.size

                if (color) colors.add(color)
                if (size) sizes.add(size)
            }
        }

        filterableProducts.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            priceCents: minPrice,
            categoryId: p.category_id,
            categoryName: category?.name || null,
            colors: Array.from(colors).filter(Boolean) as string[],
            sizes: Array.from(sizes).filter(Boolean) as string[],
            inStock: totalStock > 0,
            imageUrl: primaryImage?.url || null,
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
                    slug: category.slug,
                    count: 1,
                })
            }
        }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    )

    // If no category is selected, show the category discovery view
    if (!selectedCategorySlug) {
        return (
            <div className="min-h-[calc(100vh-3.5rem)]">
                <div className="mx-auto max-w-6xl px-4 py-16">
                    <div className="mb-12 text-center">
                        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            {tStore('categoriesTitle')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
                            Selecione uma categoria para começar a explorar a nossa coleção exclusiva.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/products?category=${cat.slug}`}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-8 transition-all duration-300 hover:border-amber-500/30 hover:bg-zinc-900/60 "
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-50 transition-colors group-hover:text-amber-400">
                                        {cat.name}
                                    </h2>
                                    <p className="mt-2 text-sm text-zinc-500">
                                        {cat.count} {cat.count === 1 ? 'produto' : 'produtos'}
                                    </p>
                                </div>

                                <div className="mt-12 flex items-center gap-2 text-sm font-semibold text-zinc-300 transition-all group-hover:gap-3 group-hover:text-white">
                                    Explorar {cat.name}
                                    <svg
                                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-3.5rem)]">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <nav className="mb-8 text-sm text-zinc-500">
                    <Link href="/" className="hover:text-zinc-300">
                        {tCommon('shop')}
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/products" className="hover:text-zinc-300">
                        {tCommon('products')}
                    </Link>
                </nav>

                <SearchResults
                    products={filterableProducts}
                    categories={categories}
                    initialCategoryId={categories.find(c => c.slug === selectedCategorySlug)?.id}
                    title={selectedCategorySlug ? categories.find(c => c.slug === selectedCategorySlug)?.name : tCommon('allProducts')}
                />
            </div>
        </div>
    )
}
