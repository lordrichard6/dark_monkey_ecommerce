import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function AdminProductsPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8 text-red-400">Admin client not configured</div>

  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      is_active,
      is_customizable,
      categories (name),
      product_variants (id, price_cents)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
        >
          + New product
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Price range</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const variants = (p.product_variants ?? []) as { price_cents: number }[]
              const minPrice = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0
              const maxPrice = variants.length ? Math.max(...variants.map((v) => v.price_cents)) : 0
              const priceRange =
                minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
              const category = (p.categories as { name?: string } | null)?.name ?? '—'
              return (
                <tr key={p.id} className="border-b border-zinc-800/50">
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
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-500 hover:text-zinc-300"
                    >
                      View
                    </Link>
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
