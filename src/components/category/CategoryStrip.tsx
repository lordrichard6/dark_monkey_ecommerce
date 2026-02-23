import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { CategoryStripClient } from './CategoryStripClient'

export async function CategoryStrip() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .not('image_url', 'is', null)
    .order('name')

  if (!categories || categories.length === 0) return null

  return (
    <CategoryStripClient
      categories={categories}
      title={t('shopByCategory')}
      viewAllLabel={t('viewAllCategories')}
    />
  )
}
