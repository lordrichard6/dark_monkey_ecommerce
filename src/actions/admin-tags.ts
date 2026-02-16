'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function createTag(input: {
    name: string
    slug: string
}) {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Database error' }

    const { data, error } = await supabase
        .from('tags')
        .insert({
            name: input.name.trim(),
            slug: input.slug.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
        })
        .select()
        .single()

    if (error) {
        console.error('Create tag error:', error)
        return { ok: false, error: error.message }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/admin/products')
    return { ok: true, data }
}

export async function deleteTag(id: string) {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Database error' }

    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete tag error:', error)
        return { ok: false, error: error.message }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/admin/products')
    return { ok: true }
}
