import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ProductStockForm } from './product-stock-form'

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
  if (!supabase) return <div className="p-8 text-red-400">Admin client not configured</div>

  const { data: product } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      is_active,
      is_customizable,
      categories (name),
      product_images (url, alt),
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

  const variants = (product.product_variants ?? []) as Array<{
    id: string
    sku: string | null
    name: string | null
    price_cents: number
    attributes: Record<string, unknown>
    product_inventory: { quantity: number }[]
  }>
  const primaryImage = (product.product_images as { url: string; alt: string | null }[])?.[0]

  return (
    <div className="p-8">
      <Link href="/admin/products" className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300">
        ← Back to products
      </Link>
      <div className="flex gap-8">
        {primaryImage?.url && (
          <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <img
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{product.name}</h1>
          <p className="mt-2 text-zinc-400">{(product.categories as { name?: string } | null)?.name}</p>
          <p className="mt-4 text-zinc-300">{product.description}</p>
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
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-amber-400 hover:text-amber-300"
          >
            View on store →
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-zinc-50">Variants & stock</h2>
        <div className="mt-4 space-y-4">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
            >
              <div>
                <p className="font-medium text-zinc-50">{v.name ?? v.sku ?? v.id.slice(0, 8)}</p>
                <p className="text-sm text-zinc-400">
                  {formatPrice(v.price_cents)}
                  {v.sku && ` · ${v.sku}`}
                </p>
              </div>
              <ProductStockForm
                variantId={v.id}
                currentQuantity={v.product_inventory?.[0]?.quantity ?? 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
