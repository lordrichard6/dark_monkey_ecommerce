'use server'

import { createClient } from '@/lib/supabase/server'

export type BundleProductItem = {
  productId: string
  productSlug: string
  productName: string
  variantId: string
  variantName: string | null
  priceCents: number
  imageUrl: string | undefined
}

export type Bundle = {
  id: string
  name: string
  slug: string
  description: string | null
  discount_percentage: number
  image_url: string | null
  items: BundleProductItem[]
  totalCents: number
  originalTotalCents: number
}

export async function getBundles(locale?: string): Promise<Bundle[]> {
  const supabase = await createClient()

  const { data: bundles, error } = await supabase
    .from('product_bundles')
    .select(
      `
      id,
      name,
      slug,
      description,
      description_de,
      description_fr,
      description_it,
      description_pt,
      discount_percentage,
      image_url,
      bundle_items (
        quantity,
        product_id,
        products (
          id,
          name,
          slug,
          product_images ( url, alt, sort_order ),
          product_variants ( id, name, price_cents, sort_order )
        )
      )
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !bundles) return []

  return bundles.map((bundle) => {
    const localDescription = getLocaleDescription(bundle, locale)

    const items: BundleProductItem[] = (bundle.bundle_items ?? []).flatMap((bi) => {
      const product = bi.products as unknown as {
        id: string
        name: string
        slug: string
        product_images: { url: string; alt: string | null; sort_order: number }[]
        product_variants: {
          id: string
          name: string | null
          price_cents: number
          sort_order: number
        }[]
      } | null
      if (!product) return []

      const primaryVariant = (product.product_variants ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      )[0]
      if (!primaryVariant) return []

      const primaryImage = (product.product_images ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      )[0]

      return [
        {
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          variantId: primaryVariant.id,
          variantName: primaryVariant.name,
          priceCents: primaryVariant.price_cents,
          imageUrl: primaryImage?.url,
        },
      ]
    })

    const originalTotalCents = items.reduce((sum, item) => sum + item.priceCents, 0)
    const totalCents = Math.round(originalTotalCents * (1 - bundle.discount_percentage / 100))

    return {
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      description: localDescription,
      discount_percentage: bundle.discount_percentage,
      image_url: bundle.image_url,
      items,
      totalCents,
      originalTotalCents,
    }
  })
}

function getLocaleDescription(
  bundle: {
    description: string | null
    description_de: string | null
    description_fr: string | null
    description_it: string | null
    description_pt: string | null
  },
  locale?: string
): string | null {
  switch (locale) {
    case 'de':
      return bundle.description_de ?? bundle.description
    case 'fr':
      return bundle.description_fr ?? bundle.description
    case 'it':
      return bundle.description_it ?? bundle.description
    case 'pt':
      return bundle.description_pt ?? bundle.description
    default:
      return bundle.description
  }
}
