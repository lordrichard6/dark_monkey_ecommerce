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

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ order_id?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductMetadata(slug)

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

  const images = (product?.product_images as { url: string; alt: string | null; sort_order: number; color?: string | null }[]) ?? []
  const variants = (product?.product_variants as Array<{
    id: string
    name: string | null
    price_cents: number
    attributes: Record<string, string>
    sort_order: number
    product_inventory: any
  }>) ?? []
  const minPrice = (variants || []).length ? Math.min(...(variants || []).map((v) => v.price_cents || 0)) : 0
  const sortedImages = images.length ? [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : []
  const primaryImage = sortedImages[0]
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
        <nav className="mb-8 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            {tCommon('shop')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">{product.name}</span>
        </nav>

        <ProductMain
          product={{
            ...product,
            categories: Array.isArray(product.categories) ? product.categories[0] : product.categories,
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
      </div>
    </div>
  )
}
