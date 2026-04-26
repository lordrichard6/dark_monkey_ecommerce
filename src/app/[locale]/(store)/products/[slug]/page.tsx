import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getStoreSetting } from '@/actions/admin-shipping'
import { getBestsellerProductIds } from '@/lib/trust-urgency'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sanitizeProductHtml } from '@/lib/sanitize-html.server'
import { parsePrintfulDescription, extractMaterialInfo } from '@/lib/printful-description'
import { ProductMain } from './product-main'
import type { ReviewRow } from '@/components/reviews/ProductReviews'
import { getTranslations, setRequestLocale } from 'next-intl/server'
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
import { Suspense } from 'react'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { FrequentlyBought } from '@/components/product/FrequentlyBought'
import { RecentlyViewed } from '@/components/product/RecentlyViewed'

type Props = {
  params: Promise<{ slug: string; locale: string }>
  searchParams?: Promise<{ order_id?: string }>
}

const SUPPORTED_LOCALES = ['en', 'pt', 'de', 'it', 'fr'] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const product = await getProductMetadata(slug)

  if (!product) return { title: 'Product' }

  // Use meta_description override if set, otherwise derive from the locale-aware description
  const translations = (product as Record<string, unknown>).description_translations as Record<
    string,
    string
  > | null
  const localeDescription =
    locale && translations?.[locale] ? translations[locale] : product.description
  const metaDescriptionOverride = (
    (product as Record<string, unknown>).meta_description as string | null
  )?.trim()
  const description =
    metaDescriptionOverride ||
    (localeDescription
      ? localeDescription
          .replace(/<[^>]+>/g, '')
          .trim()
          .slice(0, 160)
      : `Shop ${product.name} at Dark Monkey`)

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch').replace(
    /\/$/,
    ''
  )

  // Sort images and pick the first for OG image
  const rawImages = Array.isArray(product.product_images) ? product.product_images : []
  const sortedMetaImages = [...rawImages].sort(
    (a, b) =>
      ((a as { sort_order?: number }).sort_order ?? 0) -
      ((b as { sort_order?: number }).sort_order ?? 0)
  )
  const ogImageUrl = (sortedMetaImages[0] as { url?: string } | undefined)?.url

  const ogImages = ogImageUrl
    ? [{ url: ogImageUrl, width: 1200, height: 1200, alt: product.name }]
    : []

  const canonicalLocale = locale ?? 'en'

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `${siteUrl}/${canonicalLocale}/products/${slug}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, `${siteUrl}/${loc}/products/${slug}`])
      ),
    },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: `${siteUrl}/${canonicalLocale}/products/${slug}`,
      siteName: 'Dark Monkey',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  }
}

function ProductSectionSkeleton() {
  return (
    <div className="mt-12 animate-pulse">
      <div className="mb-4 h-5 w-40 rounded bg-zinc-800" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square rounded-lg bg-zinc-800" />
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
            <div className="h-4 w-1/2 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const supabase = getAdminClient()
  if (!supabase) return []

  const { data: products } = await supabase.from('products').select('slug').eq('is_active', true)
  // .is('deleted_at', null)

  // Cross-product every slug with every supported locale so all locale variants
  // get pre-rendered at build time (avoids cold ISR miss on first crawl per locale).
  return (products ?? []).flatMap((p) =>
    SUPPORTED_LOCALES.map((locale) => ({ slug: p.slug, locale }))
  )
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug, locale } = await params
  setRequestLocale(locale)
  const { order_id: orderIdFromQuery } = (await searchParams) ?? {}
  const supabase = await createClient()

  // Use cached query - shared with generateMetadata
  const { data: product, error } = await getProductBySlug(slug)

  if (error || !product) notFound()

  // Fetch related data in parallel with cached queries
  const user = await getUserSafe(supabase)

  const [
    customizationRule,
    userIsInWishlist,
    reviews,
    userReview,
    bestsellerIds,
    shipmentInfo,
    gpsrInfo,
  ] = await Promise.all([
    product.is_customizable ? getProductCustomizationRule(product.id) : Promise.resolve(null),
    user?.id ? isProductInWishlist(product.id, user.id) : Promise.resolve(false),
    getProductReviews(product.id),
    user?.id ? getUserProductReview(product.id, user.id) : Promise.resolve(null),
    getBestsellerProductIds(),
    getStoreSetting('shipment_info'),
    getStoreSetting('gpsr_info'),
  ])

  const isBestseller = bestsellerIds.has(product.id)

  // Images are now properly synced from Printful with variant_id mapping
  const images =
    (product?.product_images as Array<{
      url: string
      alt: string | null
      sort_order: number
      color?: string | null
      variant_id?: string | null
    }>) ?? []

  const variants =
    (product?.product_variants as Array<{
      id: string
      name: string | null
      price_cents: number
      attributes: Record<string, string>
      sort_order: number
      printful_sync_variant_id?: number
      product_inventory?: Array<{ quantity: number }> | { quantity: number } | null
    }>) ?? []

  const minPrice = (variants || []).length
    ? Math.min(...(variants || []).map((v) => v.price_cents || 0))
    : 0
  const sortedImages = images.length
    ? [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : []
  const primaryImage = sortedImages[0]

  const variantsWithStock = (variants || [])
    .map((v) => ({
      ...v,
      stock: Array.isArray(v.product_inventory)
        ? (v.product_inventory[0]?.quantity ?? 0)
        : (v.product_inventory?.quantity ?? 0),
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  // Determine real availability based on stock
  const hasStock = variantsWithStock.some((v) => v.stock > 0)
  const availability = hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  // Aggregate review stats for JSON-LD
  const reviewCount = reviews.length
  const avgRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch').replace(
    /\/$/,
    ''
  )

  // priceValidUntil — 1 year from today (Google recommends <= 1 year out)
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const productCategory = Array.isArray(product.categories)
    ? product.categories[0]?.name
    : (product.categories as { name?: string } | null | undefined)?.name

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/${locale}/products/${product.slug}#product`,
    name: product.name,
    description: product.description
      ? product.description
          .replace(/<[^>]+>/g, '')
          .trim()
          .slice(0, 5000)
      : undefined,
    image: sortedImages.map((img) => img.url),
    url: `${siteUrl}/${locale}/products/${product.slug}`,
    sku: product.id,
    mpn: product.id,
    ...(productCategory ? { category: productCategory } : {}),
    brand: {
      '@type': 'Brand',
      name: 'Dark Monkey',
    },
    offers: {
      '@type': 'Offer',
      '@id': `${siteUrl}/${locale}/products/${product.slug}#offer`,
      price: (minPrice / 100).toFixed(2),
      priceCurrency: 'CHF',
      priceValidUntil,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      url: `${siteUrl}/${locale}/products/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'Dark Monkey',
        url: siteUrl,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CH',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'CHF',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'CH',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
    },
  }

  // Only add aggregateRating if there are reviews
  if (avgRating !== null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }

    // Include up to 5 most recent reviews as individual Review entries
    jsonLd.review = reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        '@type': 'Person',
        name: r.reviewer_display_name || 'Verified Buyer',
      },
      ...(r.created_at ? { datePublished: r.created_at } : {}),
      ...(r.comment ? { reviewBody: r.comment } : {}),
    }))
  }

  const tCommon = await getTranslations('common')
  const tProduct = await getTranslations('product')

  // Build breadcrumb items — include category if available
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories
  const breadcrumbItems = [
    { label: tCommon('shop'), href: '/' },
    ...(category?.name && category?.slug
      ? [{ label: category.name, href: `/categories/${category.slug}` }]
      : []),
    { label: product.name, href: `/products/${product.slug}`, active: true },
  ]

  // BreadcrumbList JSON-LD for product — mirrors the visible breadcrumb
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tCommon('shop'),
        item: `${siteUrl}/${locale}`,
      },
      ...(category?.name && category?.slug
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: category.name,
              item: `${siteUrl}/${locale}/categories/${category.slug}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: product.name,
              item: `${siteUrl}/${locale}/products/${product.slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 2,
              name: product.name,
              item: `${siteUrl}/${locale}/products/${product.slug}`,
            },
          ]),
    ],
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <ProductMain
          product={{
            ...product,
            // Pick locale-aware description: use translation if available, fall back to EN
            description: sanitizeProductHtml(
              (() => {
                const trans = (product as Record<string, unknown>)
                  .description_translations as Record<string, string> | null
                const localized = locale && trans?.[locale] ? trans[locale] : product.description
                return parsePrintfulDescription(localized) ?? localized
              })()
            ),
            categories: category,
            images: sortedImages,
            // For existing products without material_info, auto-extract from description
            material_info: (() => {
              const stored = (product as Record<string, unknown>).material_info as string | null
              if (stored) return stored
              return extractMaterialInfo(product.description)
            })(),
            care_instructions: (product as Record<string, unknown>).care_instructions as
              | string
              | null,
            print_method: (product as Record<string, unknown>).print_method as string | null,
            size_guide_url: (product as Record<string, unknown>).size_guide_url as string | null,
            origin_country: (product as Record<string, unknown>).origin_country as string | null,
            avg_fulfillment_time: (product as Record<string, unknown>).avg_fulfillment_time as
              | string
              | null,
          }}
          shipmentInfo={shipmentInfo}
          gpsrInfo={gpsrInfo}
          images={sortedImages}
          variants={variantsWithStock}
          reviews={reviews}
          userReview={userReview}
          isBestseller={isBestseller}
          isInWishlist={userIsInWishlist}
          canSubmitReview={!!user?.id || !!orderIdFromQuery}
          orderIdFromQuery={orderIdFromQuery}
          primaryImageUrl={primaryImage?.url}
          userId={user?.id}
          storyContent={
            // Sanitize story body server-side — story content is admin-entered HTML
            product.story_content
              ? {
                  ...(product.story_content as Record<string, unknown>),
                  body: sanitizeProductHtml(
                    (product.story_content as Record<string, unknown>)?.body as string
                  ),
                }
              : product.story_content
          }
          customizationRule={
            customizationRule?.rule_def
              ? (customizationRule.rule_def as import('@/types/customization').CustomizationRuleDef)
              : null
          }
        />

        <Suspense fallback={<ProductSectionSkeleton />}>
          <FrequentlyBought productId={product.id} locale={locale} />
        </Suspense>

        <Suspense fallback={<ProductSectionSkeleton />}>
          <RelatedProducts productId={product.id} locale={locale} />
        </Suspense>

        <Suspense fallback={null}>
          <RecentlyViewed userId={user?.id} productId={product.id} />
        </Suspense>
      </div>
    </div>
  )
}
