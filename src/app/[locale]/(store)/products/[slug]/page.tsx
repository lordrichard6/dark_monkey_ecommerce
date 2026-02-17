import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductMain } from './product-main'
import type { ReviewRow } from '@/components/reviews/ProductReviews'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import {
  getProductMetadata,
  getProductBySlug,
  getProductReviews,
  getUserProductReview,
  getProductCustomizationRule,
  isProductInWishlist,
} from '@/lib/queries'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { FrequentlyBought } from '@/components/product/FrequentlyBought'
import { RecentlyViewed } from '@/components/product/RecentlyViewed'

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ order_id?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductMetadata(slug)

  if (!product) return { title: 'Product' }

  const description = product.description ?? `Shop ${product.name} at DarkMonkey`

  return {
    title: product.name,
    description,
    openGraph: {
      type: 'website',
      title: product.name,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
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
  // .is('deleted_at', null)

  return (products ?? []).map((p) => ({
    slug: p.slug,
  }))
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { order_id: orderIdFromQuery } = (await searchParams) ?? {}
  const supabase = await createClient()

  // Use cached query - shared with generateMetadata
  const { data: product, error } = await getProductBySlug(slug)

  if (error || !product) notFound()

  // Fetch related data in parallel with cached queries
  const user = await getUserSafe(supabase)

  const [customizationRule, userIsInWishlist, reviews, userReview, bestsellerIds] = await Promise.all([
    product.is_customizable ? getProductCustomizationRule(product.id) : Promise.resolve(null),
    user?.id ? isProductInWishlist(product.id, user.id) : Promise.resolve(false),
    getProductReviews(product.id),
    user?.id ? getUserProductReview(product.id, user.id) : Promise.resolve(null),
    getBestsellerProductIds(),
  ])

  const isBestseller = bestsellerIds.has(product.id)

  // Images are now properly synced from Printful with variant_id mapping
  const images = (product?.product_images as Array<{
    url: string
    alt: string | null
    sort_order: number
    color?: string | null
    variant_id?: string | null
  }>) ?? []

  const variants = (product?.product_variants as Array<{
    id: string
    name: string | null
    price_cents: number
    attributes: Record<string, string>
    sort_order: number
    printful_sync_variant_id?: number
    product_inventory?: Array<{ quantity: number }> | { quantity: number } | null
  }>) ?? []

  const minPrice = (variants || []).length ? Math.min(...(variants || []).map((v) => v.price_cents || 0)) : 0
  const sortedImages = images.length ? [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : []
  const primaryImage = sortedImages[0]

  // DEBUG: Log image data for troubleshooting
  if (process.env.NODE_ENV === 'development' && images.length === 0) {
    console.log('[ProductPage] No images found for product:', product.slug)
    console.log('[ProductPage] Product data:', {
      productId: product.id,
      hasImages: !!product?.product_images,
      rawImages: product?.product_images
    })
  }

  const variantsWithStock = (variants || [])
    .map((v) => ({
      ...v,
      stock: Array.isArray(v.product_inventory) ? (v.product_inventory[0]?.quantity ?? 0) : (v.product_inventory?.quantity ?? 0),
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

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
        <Breadcrumbs
          items={[
            { label: tCommon('shop'), href: '/' },
            { label: product.name, href: `/products/${product.slug}`, active: true }
          ]}
        />

        <ProductMain
          product={{
            ...product,
            categories: Array.isArray(product.categories) ? product.categories[0] : product.categories,
            images: sortedImages,
          }}
          images={sortedImages}
          variants={variantsWithStock}
          reviews={reviews}
          userReview={userReview}
          isBestseller={isBestseller}
          isInWishlist={userIsInWishlist}
          canSubmitReview={!!user?.id}
          orderIdFromQuery={orderIdFromQuery}
          primaryImageUrl={primaryImage?.url}
          userId={user?.id}
          storyContent={product.story_content}
          customizationRule={
            customizationRule?.rule_def
              ? (customizationRule.rule_def as import('@/types/customization').CustomizationRuleDef)
              : null
          }
        />

        <FrequentlyBought productId={product.id} locale={slug} />

        <RelatedProducts productId={product.id} locale={slug} />

        <RecentlyViewed userId={user?.id} />
      </div>
    </div>
  )
}
