import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { CategoryStripClient } from './CategoryStripClient'

export async function CategoryStrip() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  const [{ data: rawCategories }, { data: subCatCounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, image_url, is_featured, subtitle')
      .is('parent_id', null)
      .not('image_url', 'is', null)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('categories').select('id, parent_id, products(id)').not('parent_id', 'is', null),
  ])

  // Only show root categories that have at least one product in their subcategories
  const countByParent: Record<string, number> = {}
  for (const sub of subCatCounts ?? []) {
    if (!sub.parent_id) continue
    const count = Array.isArray(sub.products) ? sub.products.length : 0
    countByParent[sub.parent_id] = (countByParent[sub.parent_id] ?? 0) + count
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
