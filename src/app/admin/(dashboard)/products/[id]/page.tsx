import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { notFound } from 'next/navigation'
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

  const { data: product } = await supabase
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

  if (!product) notFound()

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
    product_inventory: { quantity: number }[]
  }>
  const images = ((product.product_images as { id: string; url: string; alt: string | null; sort_order?: number }[]) ?? []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const priceRange =
    variants.length === 0
      ? null
      : (() => {
          const prices = variants.map((v) => v.price_cents)
          const min = Math.min(...prices)
          const max = Math.max(...prices)
          return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
        })()

  return (
    <div className="p-8">
      <Link href="/admin/products" className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300">
        ← Back to products
      </Link>

      <div className="flex gap-10">
        {/* Left: product images (small thumbnails, click to expand) */}
        <div className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <ProductImageManager productId={product.id} images={images} />
        </div>

        {/* Right: product details */}
        <div className="min-w-0 flex-1">
          <ProductEditableFields
            productId={product.id}
            name={product.name}
            slug={product.slug}
            description={product.description}
            nameAction={
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-50 transition hover:bg-zinc-800 hover:text-amber-400"
                title="View on store"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            }
          />
          <div className="mt-4">
            <ProductCategoryField
              productId={product.id}
              categoryId={product.category_id ?? null}
              categories={(categories ?? []) as { id: string; name: string }[]}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <span
              className={`rounded px-2 py-1 text-xs ${
                product.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
            {product.is_customizable && (
              <span className="rounded bg-amber-900/40 px-2 py-1 text-xs text-amber-400">Customizable</span>
            )}
          </div>

          <div className="mt-10 border-t border-zinc-800 pt-8">
            <h2 className="text-lg font-semibold text-zinc-50">Variants & stock</h2>
            <div className="mt-6">
              <ProductDetailAdmin variants={variants} />
            </div>
            <ProductDescriptionField productId={product.id} description={product.description} />
          </div>
        </div>
      </div>
    </div>
  )
}
