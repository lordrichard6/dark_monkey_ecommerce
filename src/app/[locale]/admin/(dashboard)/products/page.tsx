import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { SyncPrintfulButton } from './sync-printful-button'
import { ProductActionsDropdown } from './product-actions-dropdown'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function AdminProductsPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      is_active,
      is_customizable,
      categories (name),
      product_images (id, url, sort_order),
      product_variants (id, price_cents)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-50">Products</h1>
        <div className="flex items-center gap-3">
          <SyncPrintfulButton />
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            + New product
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="w-14 px-4 py-3 text-left text-sm font-medium text-zinc-400"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Images</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Price range</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const variants = (p.product_variants ?? []) as { price_cents: number }[]
              const images = ((p.product_images ?? []) as { id: string; url: string; sort_order?: number }[])
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              const thumbnailUrl = images[0]?.url
              const minPrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
              const maxPrice = variants.length ? Math.max(...variants.map((v) => v.price_cents)) : 0
              const priceRange =
                minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
              const category = (p.categories as { name?: string } | null)?.name ?? '—'
              return (
                <tr key={p.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {thumbnailUrl ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded ring-1 ring-zinc-700">
                          <img
                            src={thumbnailUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover object-center scale-110"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500 ring-1 ring-zinc-700">
                          —
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-zinc-50 hover:text-amber-400">
                      {p.name}
                    </Link>
                    {p.is_customizable && (
                      <span className="ml-2 rounded bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">
                        Customizable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{category}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{images.length}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{priceRange}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        p.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductActionsDropdown
                      productId={p.id}
                      productName={p.name}
                      productSlug={p.slug}
                      isActive={p.is_active}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(products ?? []).length === 0 && (
          <p className="p-8 text-center text-zinc-500">No products yet</p>
        )}
      </div>
    </div>
  )
}
