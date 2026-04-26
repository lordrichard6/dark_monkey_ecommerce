import { createClient, getCachedAllCategories } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { CategoryStripClient } from './CategoryStripClient'

export async function CategoryStrip() {
  // Categories pulled via the cached superset — also used by NewArrivalsSection,
  // so the second caller in the same render gets a free hit. The product
  // category_id rollup is a different table, so it stays as its own query.
  const [allCategories, t, supabase] = await Promise.all([
    getCachedAllCategories(),
    getTranslations('home'),
    createClient(),
  ])

  const { data: productRows } = await supabase
    .from('products')
    .select('category_id')
    .eq('is_active', true)
    .is('deleted_at', null)

  // Build child → root lookup so subcategory products roll up to their parent
  const childToRoot: Record<string, string> = {}
  for (const cat of allCategories) {
    if (cat.parent_id) childToRoot[cat.id] = cat.parent_id
  }

  // Count products per root category (direct + via subcategory)
  const countByParent: Record<string, number> = {}
  for (const row of productRows ?? []) {
    if (!row.category_id) continue
    const rootId = childToRoot[row.category_id] ?? row.category_id
    countByParent[rootId] = (countByParent[rootId] ?? 0) + 1
  }

  // Filter + sort locally — CategoryStrip only shows root categories that have
  // an image AND at least one active product. Sort: featured → sort_order → name.
  const categories = allCategories
    .filter((c) => !c.parent_id && typeof c.image_url === 'string' && c.image_url)
    .filter((c) => (countByParent[c.id] ?? 0) > 0)
    .sort((a, b) => {
      const featuredDiff = (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
      if (featuredDiff !== 0) return featuredDiff
      const sortDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
      if (sortDiff !== 0) return sortDiff
      return a.name.localeCompare(b.name)
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image_url: c.image_url as string,
      is_featured: !!c.is_featured,
      subtitle: (c.subtitle as string | null) ?? null,
    }))

  if (categories.length === 0) return null

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
