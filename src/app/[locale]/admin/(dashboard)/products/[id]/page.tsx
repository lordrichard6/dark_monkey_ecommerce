import Link from 'next/link'

export const dynamic = 'force-dynamic'

import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { ProductDetailAdmin } from './product-detail-admin'
import { ProductImageManager } from './product-image-manager'
import { ProductEditableFields } from './product-editable-fields'
import { ProductDescriptionField } from './product-description-field'
import { ProductCategoryField } from './product-category-field'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      category_id,
      is_active,
      is_customizable,
      categories (id, name),
      product_images (id, url, alt, sort_order),
      product_variants (
        id,
        sku,
        name,
        price_cents,
        attributes,
        product_inventory (quantity)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return <div className="p-8 text-red-500">Error fetching product: {error.message}</div>
  }

  if (!product) {
    return <div className="p-8 text-amber-500">Product with ID {id} not found in database.</div>
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true })

  const variants = (product.product_variants ?? []) as Array<{
    id: string
    sku: string | null
    name: string | null
    price_cents: number
    attributes: Record<string, unknown>
    product_inventory: { quantity: number } | null
  }>

  // Debug: Log what inventory data we're actually getting
  console.log('[AdminProductPage] Variants with inventory:', JSON.stringify(variants.map(v => ({
    id: v.id,
    name: v.name,
    inventory: v.product_inventory
  })), null, 2))
  const images = ((product.product_images as { id: string; url: string; alt: string | null; sort_order?: number }[]) ?? []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pb-20 md:p-8">
      {/* Back Button */}
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to products
      </Link>

      {/* Product Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <ProductEditableFields
              productId={product.id}
              name={product.name}
              slug={product.slug}
              nameAction={
                <Link
                  href={`/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 transition hover:border-amber-500 hover:bg-amber-950/30 hover:text-amber-400"
                  title="View on store"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              }
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <ProductCategoryField
            productId={product.id}
            categoryId={product.category_id ?? null}
            categories={(categories ?? []) as { id: string; name: string }[]}
          />
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${product.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
              }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
          {product.is_customizable && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Customizable
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Stacked on mobile, side-by-side on desktop */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Images Section */}
        <div className="order-2 lg:order-1">
          <div className="sticky top-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Product Images</h3>
            <ProductImageManager productId={product.id} images={images} />
          </div>
        </div>

        {/* Variants & Stock Section */}
        <div className="order-1 space-y-6 lg:order-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-50">Variants & Stock</h2>
            <ProductDetailAdmin variants={variants} />
          </div>

          {/* Description */}
          <div className="border-t border-zinc-800 pt-6">
            <ProductDescriptionField productId={product.id} description={product.description} />
          </div>
        </div>
      </div>
    </div>
  )
}
