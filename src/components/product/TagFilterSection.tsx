import { createClient } from '@/lib/supabase/server'
import { TagFilter } from './TagFilter'

export async function TagFilterSection({ selectedTag }: { selectedTag?: string }) {
    const supabase = await createClient()
    const { data: tagsData } = await supabase
        .from('tags')
        .select('id, name, slug')
        .order('name', { ascending: true })

    return <TagFilter tags={tagsData ?? []} selectedTag={selectedTag} />
}
