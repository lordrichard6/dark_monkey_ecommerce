import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { ProductEditor } from './product-editor'
import { ProductEditableFields } from './product-editable-fields'
import { ProductDescriptionField } from './product-description-field'
import { ProductCategoryField } from './product-category-field'
import { ProductTagsField } from './product-tags-field'

export const dynamic = 'force-dynamic'

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
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const [productRes, tagsRes, productTagsRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        description,
        category_id,
        is_active,
        is_customizable,
        printful_sync_product_id,
        product_images (id, url, alt, sort_order, color),
        product_variants (
          id,
          sku,
          name,
          price_cents,
          compare_at_price_cents,
          attributes,
          product_inventory (quantity)
        )
      `
      )
      .eq('id', id)
      .single(),
    supabase.from('tags').select('id, name').order('name', { ascending: true }),
    supabase.from('product_tags').select('tag_id').eq('product_id', id),
  ])

  const { data: product, error } = productRes

  if (error) {
    return <div className="p-8 text-red-500">Error fetching product: {error.message}</div>
  }

  if (!product) {
    return <div className="p-8 text-amber-500">Product with ID {id} not found in database.</div>
  }

  const availableTags = (tagsRes.data ?? []) as { id: string; name: string }[]
  const currentTagIds = (productTagsRes.data ?? []).map((pt: any) => pt.tag_id)

  const variants = (product.product_variants ?? []) as Array<{
    id: string
    sku: string | null
    name: string | null
    price_cents: number
    compare_at_price_cents: number | null
    attributes: Record<string, unknown>
    product_inventory: any
  }>

  const images = (
    (product.product_images as {
      id: string
      url: string
      alt: string | null
      sort_order?: number
      color?: string | null
    }[]) ?? []
  ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pb-20 md:p-8">
      {/* Back Button */}
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-300"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
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
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </Link>
              }
            />
          </div>
        </div>

        {/* Category & Tags */}
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <ProductCategoryField productId={product.id} categoryId={product.category_id ?? null} />
          <ProductTagsField
            productId={product.id}
            initialTagIds={currentTagIds}
            availableTags={availableTags}
          />
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              product.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`}
            />
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
          {product.is_customizable && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Customizable
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Stacked on mobile, side-by-side on desktop */}
      <ProductEditor
        productId={product.id}
        printfulSyncProductId={product.printful_sync_product_id ?? null}
        images={images}
        variants={variants}
      />

      {/* Description below */}
      <div className="mt-6 border-t border-zinc-800 pt-6">
        <ProductDescriptionField productId={product.id} description={product.description} />
      </div>
    </div>
  )
}
