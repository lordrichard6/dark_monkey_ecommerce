'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateStoryContent, type StoryContent } from '@/lib/story-content'

export type SaveStoryResult = { ok: true } | { ok: false; error: string }

/**
 * Save story content for a product
 * Only admins can perform this action
 */
export async function saveProductStory(
    productId: string,
    storyContent: StoryContent
): Promise<SaveStoryResult> {
    const supabase = await createClient()

    // Check admin status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return { ok: false, error: 'Not authorized' }
    }

    // Validate story content
    if (!validateStoryContent(storyContent)) {
        return { ok: false, error: 'Invalid story content' }
    }

    // Update product
    const { error: updateError } = await supabase
        .from('products')
        .update({ story_content: storyContent })
        .eq('id', productId)

    if (updateError) {
        return { ok: false, error: updateError.message }
    }

    // Get product slug for revalidation
    const { data: product } = await supabase
        .from('products')
        .select('slug')
        .eq('id', productId)
        .single()

    if (product?.slug) {
        revalidatePath(`/products/${product.slug}`)
    }

    revalidatePath('/admin/products')

    return { ok: true }
}

/**
 * Get product story for editing
 */
export async function getProductStory(productId: string) {
    const supabase = await createClient()

    // Check admin status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return { data: null, error: 'Not authorized' }
    }

    const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, story_content')
        .eq('id', productId)
        .single()

    return { data, error: error?.message }
}
