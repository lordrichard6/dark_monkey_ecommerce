import { createClient } from '@/lib/supabase/server'
import { TagFilter } from './TagFilter'

export async function TagFilterSection({ selectedTag }: { selectedTag?: string }) {
  const supabase = await createClient()

  // Only fetch tags that have at least one active, non-deleted product
  const { data: activePtData } = await supabase
    .from('product_tags')
    .select('tag_id, products!inner(id)')
    .eq('products.is_active', true)
    .is('products.deleted_at', null)

  const activeTagIds = [...new Set((activePtData ?? []).map((pt) => pt.tag_id))]

  const { data: tagsData } =
    activeTagIds.length > 0
      ? await supabase
          .from('tags')
          .select('id, name, slug')
          .in('id', activeTagIds)
          .order('name', { ascending: true })
      : { data: [] }

  return <TagFilter tags={tagsData ?? []} selectedTag={selectedTag} />
}
