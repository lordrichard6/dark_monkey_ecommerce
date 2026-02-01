import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { CreateProductForm } from './create-product-form'

export default async function AdminNewProductPage() {
  const supabase = getAdminClient()
  if (!supabase) return <div className="p-8 text-red-400">Admin client not configured</div>

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8">
      <Link href="/admin/products" className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300">
        ← Back to products
      </Link>
      <h1 className="text-2xl font-bold text-zinc-50">New product</h1>
      <CreateProductForm categories={categories ?? []} />
    </div>
  )
}
