import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { CategoryStripClient } from './CategoryStripClient'

export async function CategoryStrip() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, is_featured, subtitle')
    .is('parent_id', null)
    .not('image_url', 'is', null)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

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
