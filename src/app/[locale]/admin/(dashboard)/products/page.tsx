import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { SyncPrintfulButton } from './sync-printful-button'
import { ProductListTable } from '@/components/admin/ProductListTable'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}


export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

  const page = parseInt(searchParams.page || '1', 10) || 1
  const limit = 20
  const start = (page - 1) * limit
  const end = start + limit - 1

  const { data: products, count } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      is_active,
      is_customizable,
      categories (name),
      product_images (id, url, sort_order, color),
      product_variants (id, price_cents),
      created_at
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(start, end)

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Products</h1>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <SyncPrintfulButton />
          <Link
            href="/admin/products/new"
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-center text-sm font-medium text-zinc-950 hover:bg-amber-400 sm:w-auto"
          >
            + New product
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ProductListTable
          products={products as any}
          currentPage={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}
