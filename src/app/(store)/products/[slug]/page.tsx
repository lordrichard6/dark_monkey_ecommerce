import { createClient, getUserSafe } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductImageWithFallback } from '@/components/product/ProductImageWithFallback'
import Link from 'next/link'
import { AddToCartForm } from './add-to-cart-form'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

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

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
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

  const images = (product.product_images as { url: string; alt: string | null; sort_order: number }[]) ?? []
  const variants = (product.product_variants as Array<{
    id: string
    name: string | null
    price_cents: number
    attributes: Record<string, string>
    sort_order: number
    product_inventory: { quantity: number }[]
  }>) ?? []
  const minPrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const primaryImage = sortedImages[0]
  const variantsWithStock = variants
    .map((v) => ({
      ...v,
      stock: v.product_inventory?.[0]?.quantity ?? 0,
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-8 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            {primaryImage ? (
              <ProductImageWithFallback
                src={primaryImage.url}
                alt={primaryImage.alt ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                unoptimized={
                  primaryImage.url.endsWith('.svg') ||
                  primaryImage.url.includes('picsum.photos') ||
                  primaryImage.url.includes('/storage/') ||
                  primaryImage.url.includes('product-images')
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-600">
                No image
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-zinc-50 md:text-3xl">
              {product.name}
            </h1>
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
          </div>
        </div>
      </div>
    </div>
  )
}
