import { Suspense } from 'react'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { Hero } from '@/components/Hero'
import { ProductGrid } from '@/components/product/ProductGrid'
import { TagFilter } from '@/components/product/TagFilter'
import { getTranslations } from 'next-intl/server'
import { NewArrivals } from '@/components/product/NewArrivals'
import type { Metadata } from 'next'
import { GalleryPreviewSection } from '@/components/gallery/GalleryPreviewSection'
import { AuthCTASection } from '@/components/auth/AuthCTASection'

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string; tag?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('home')
  return {
    description: t('metaDescription'),
  }
}

// ISR: Revalidate home page every 10 minutes (shows dynamic content like new arrivals)
export const revalidate = 600

export default async function HomePage({ params, searchParams }: Props) {
  const { sort = 'newest', tag } = await searchParams

  let productsWithPrice: any[] = []
  let newArrivals: any[] = []
  let availableTags: any[] = []

  try {
    const supabase = await createClient()

    // Fetch available tags for filter bar
    const { data: tagsData } = await supabase
      .from('tags')
      .select('id, name, slug')
      .order('name', { ascending: true })
    availableTags = tagsData ?? []

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
      // If no tag is selected, we replace the selection to avoid INNER JOIN requirement on tags
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

    if (sort === 'price-asc' || sort === 'price-desc') {
      // Sort is handled in-memory for price as variants are involved
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const [productsResult, newArrivalsResult, user, bestsellerIds] = await Promise.all([
      query,
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
        .limit(50), // Fetch more to allow for category filtering in New Arrivals
      getUserSafe(supabase),
      getBestsellerProductIds(),
    ])
    const { data: products } = productsResult
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

      // Find the variant with the lowest price to display "From X" or just "X"
      // And use that variant's compare_at_price
      let priceCents = 0
      let compareAtPriceCents: number | null = null

      if (variants && variants.length > 0) {
        // Sort by price to find the cheapest variant
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

    productsWithPrice = processProducts(products ?? [])
    newArrivals = processProducts(newArrivalsData ?? [])
  } catch {
    productsWithPrice = []
    newArrivals = []
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
      <NewArrivals products={newArrivals} />


      <div id="products" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-4">
        <TagFilter tags={availableTags} selectedTag={tag} />
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-900" />}>
          <ProductGrid
            products={sortedProducts}
            title={tag ? `Discovery: ${availableTags.find(t => t.slug === tag)?.name || tag}` : t('featuredProducts')}
            sort={sort}
          />
        </Suspense>
      </div>


      <GalleryPreviewSection />
      <AuthCTASection />
    </div>
  )
}
