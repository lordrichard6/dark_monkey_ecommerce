import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { CategoryStripClient } from './CategoryStripClient'

export async function CategoryStrip() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  const [{ data: rawCategories }, { data: allCategories }, { data: productRows }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, image_url, is_featured, subtitle')
        .is('parent_id', null)
        .not('image_url', 'is', null)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      // Lightweight: only need id + parent_id to build the hierarchy map
      supabase.from('categories').select('id, parent_id'),
      // One column per row instead of nested product arrays
      supabase.from('products').select('category_id').eq('is_active', true).is('deleted_at', null),
    ])

  // Build a child→root lookup so we can roll up subcategory products
  const childToRoot: Record<string, string> = {}
  for (const cat of allCategories ?? []) {
    if (cat.parent_id) childToRoot[cat.id] = cat.parent_id
  }

  // Count products per root category (direct + via subcategory)
  const countByParent: Record<string, number> = {}
  for (const row of productRows ?? []) {
    if (!row.category_id) continue
    const rootId = childToRoot[row.category_id] ?? row.category_id
    countByParent[rootId] = (countByParent[rootId] ?? 0) + 1
  }

  const categories = (rawCategories ?? []).filter((cat) => (countByParent[cat.id] ?? 0) > 0)

  if (!categories || categories.length === 0) return null

  return (
    <CategoryStripClient
      categories={categories}
      title={t('shopByCategory')}
      viewAllLabel={t('viewAllCategories')}
      collectionsLabel={t('categoryStripLabel')}
      exploreLabel={t('categoryExplore')}
    />
  )
}
