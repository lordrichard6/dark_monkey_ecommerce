import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { notFound } from 'next/navigation'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import Link from 'next/link'
import { AddToCartForm } from './add-to-cart-form'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { ProductReviews } from '@/components/reviews/ProductReviews'
import type { ReviewRow } from '@/components/reviews/ProductReviews'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ order_id?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) return { title: 'Product' }

  return {
    title: product.name,
    description: product.description ?? `Shop ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
    },
  }
}

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const supabase = getAdminClient()
  if (!supabase) return []

  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)

  return (products ?? []).map((p) => ({
    slug: p.slug,
  }))
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { order_id: orderIdFromQuery } = (await searchParams) ?? {}
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      is_customizable,
      category_id,
      categories (name, slug),
      product_images (url, alt, sort_order),
      product_variants (
        id,
        name,
        price_cents,
        attributes,
        sort_order,
        product_inventory (quantity)
      )
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) notFound()

  let customizationRule: { rule_def: unknown } | null = null
  if (product.is_customizable) {
    const { data: rule } = await supabase
      .from('customization_rules')
      .select('rule_def')
      .eq('product_id', product.id)
      .single()
    customizationRule = rule
  }

  const user = await getUserSafe(supabase)
  const { data: wishlistRow } = user?.id
    ? await supabase
      .from('user_wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
    : { data: null }
  const isInWishlist = !!wishlistRow

  const [reviewsResult, bestsellerIds] = await Promise.all([
    supabase
      .from('product_reviews')
      .select('id, rating, comment, reviewer_display_name, order_id, created_at')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false }),
    getBestsellerProductIds(),
  ])
  const { data: reviewsData } = reviewsResult
  const reviews = (reviewsData ?? []) as ReviewRow[]
  const isBestseller = bestsellerIds.has(product.id)

  const { data: userReviewRow } = user?.id
    ? await supabase
      .from('product_reviews')
      .select('id, rating, comment, reviewer_display_name, order_id, created_at')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .maybeSingle()
    : { data: null }
  const userReview = userReviewRow as ReviewRow | null

  const images = (product.product_images as { url: string; alt: string | null; sort_order: number }[]) ?? []
  const variants = (product.product_variants as Array<{
    id: string
    name: string | null
    price_cents: number
    attributes: Record<string, string>
    sort_order: number
    product_inventory: any
  }>) ?? []
  const minPrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const primaryImage = sortedImages[0]
  const variantsWithStock = variants
    .map((v) => ({
      ...v,
      stock: Array.isArray(v.product_inventory) ? v.product_inventory[0]?.quantity : (v.product_inventory?.quantity ?? 0),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: sortedImages[0]?.url,
    offers: {
      '@type': 'Offer',
      price: minPrice / 100,
      priceCurrency: 'CHF',
      availability: 'https://schema.org/InStock',
    },
  }

  const tCommon = await getTranslations('common')
  const tProduct = await getTranslations('product')

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-8 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            {tCommon('shop')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <ProductImageGallery
            images={sortedImages}
            productName={product.name}
          />

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-50 md:text-3xl">
                {product.name}
              </h1>
              {isBestseller && (
                <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                  {tProduct('bestseller')}
                </span>
              )}
            </div>
            {product.description && (
              <p className="mt-4 text-zinc-400">{product.description}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <WishlistButton
                productId={product.id}
                productSlug={product.slug}
                isInWishlist={isInWishlist}
                variant="button"
              />
            </div>
            <AddToCartForm
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              variants={variantsWithStock}
              primaryImageUrl={primaryImage?.url}
              customizationRule={
                customizationRule?.rule_def
                  ? (customizationRule.rule_def as import('@/types/customization').CustomizationRuleDef)
                  : null
              }
              productCategory={
                (product.categories as { name?: string } | null)?.name
              }
            />
            <ProductReviews
              productId={product.id}
              productSlug={product.slug}
              reviews={reviews}
              userReview={userReview}
              canSubmit={!!user?.id}
              orderIdFromQuery={orderIdFromQuery}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
