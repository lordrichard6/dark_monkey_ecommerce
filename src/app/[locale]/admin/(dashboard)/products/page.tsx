import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { FetchLatestProductButton } from './fetch-latest-button'
import { SyncPrintfulModal } from '@/components/admin/SyncPrintfulModal'
import { ProductListTable } from '@/components/admin/ProductListTable'
import { getTranslations } from 'next-intl/server'

const VALID_SORT_COLS = ['created_at', 'name', 'is_active'] as const
type SortCol = (typeof VALID_SORT_COLS)[number]

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
    category?: string
    tag?: string
    sort?: string
    dir?: string
  }>
}) {
  const t = await getTranslations('admin')
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const {
    page: pageParam,
    limit: limitParam,
    search,
    status,
    category,
    tag,
    sort,
    dir,
  } = await searchParams

  const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 10), 100)
  const page = parseInt(pageParam || '1', 10) || 1
  const start = (page - 1) * limit
  const end = start + limit - 1

  const sortCol: SortCol = VALID_SORT_COLS.includes(sort as SortCol)
    ? (sort as SortCol)
    : 'created_at'
  const sortAsc = dir === 'asc'

  // Build base query
  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      is_active,
      is_featured,
      is_customizable,
      category_id,
      categories (id, name),
      product_images (id, url, sort_order),
      product_variants (id, price_cents),
      product_tags (tag_id, tags (id, name)),
      created_at
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)

  // --- Filters ---
  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }
  if (category) {
    query = query.eq('category_id', category)
  }

  // --- Sort ---
  // Price sorting isn't a native column, so we fall back to created_at for it
  // (handled client-side for the current page)
  if (sortCol === 'name') {
    query = query.order('name', { ascending: sortAsc })
  } else if (sortCol === 'is_active') {
    query = query
      .order('is_active', { ascending: sortAsc })
      .order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: sortAsc })
  }

  // Tag filter — fetch matching product IDs first
  if (tag) {
    const { data: taggedIds } = await supabase
      .from('product_tags')
      .select('product_id')
      .eq('tag_id', tag)
    const ids = (taggedIds ?? []).map((t) => t.product_id)
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      // No products match this tag — force empty result
      query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
    }
  }

  query = query.range(start, end)

  const supabaseUser = await createClient()
  const {
    data: { user: currentUser },
  } = await supabaseUser.auth.getUser()

  const [
    { data: products, count, error },
    { data: allCategories },
    { data: adminProfiles },
    { data: allTags },
  ] = await Promise.all([
    query,
    supabase
      .from('categories')
      .select('id, name, parent_id')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('user_profiles')
      .select('id, admin_color, display_name')
      .eq('is_admin', true)
      .not('admin_color', 'is', null),
    supabase.from('tags').select('id, name').order('name', { ascending: true }),
  ])

  const productIds = (products ?? []).map((p) => p.id)
  const { data: votes } =
    productIds.length > 0
      ? await supabase
          .from('product_votes')
          .select('product_id, user_id, vote')
          .in('product_id', productIds)
      : { data: [] }

  if (error) {
    console.error('[AdminProductsPage] Database error:', error)
  }

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">{t('products.title')}</h1>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <FetchLatestProductButton />
          <SyncPrintfulModal />
          <Link
            href="/admin/products/new"
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-center text-sm font-medium text-zinc-950 hover:bg-amber-400 sm:w-auto"
          >
            {t('products.newProduct')}
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ProductListTable
          products={(products || []).map((p) => {
            const cats = p.categories
            const category = Array.isArray(cats) ? (cats[0] ?? null) : cats
            const tags = (p.product_tags ?? [])
              .map((pt) => {
                const t = pt.tags
                return t ? (Array.isArray(t) ? (t[0] ?? null) : t) : null
              })
              .filter((t): t is { id: string; name: string } => t !== null)
            return {
              ...p,
              categories: category as { id: string; name: string } | null,
              product_tags: tags,
            }
          })}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count ?? 0}
          limit={limit}
          categories={allCategories ?? []}
          search={search ?? ''}
          statusFilter={status ?? ''}
          categoryFilter={category ?? ''}
          sortBy={sortCol}
          sortDir={sortAsc ? 'asc' : 'desc'}
          votes={(votes ?? []) as { product_id: string; user_id: string; vote: 'up' | 'down' }[]}
          adminProfiles={
            (adminProfiles ?? []) as {
              id: string
              admin_color: string | null
              display_name?: string | null
            }[]
          }
          currentUserId={currentUser?.id ?? ''}
          allTags={allTags ?? []}
          tagFilter={tag ?? ''}
        />
      </div>
    </div>
  )
}
