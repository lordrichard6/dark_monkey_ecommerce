'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type FeedPostType = 'drop' | 'promo' | 'story' | 'community' | 'new_product' | 'sale'

export type FeedPost = {
  id: string
  type: FeedPostType
  title: string
  body: string | null
  image_url: string | null
  product_id: string | null
  author_id: string | null
  is_published: boolean
  published_at: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  // joined
  product?: {
    id: string
    name: string
    slug: string
    product_images: { url: string; sort_order: number }[]
  } | null
  author?: { display_name: string | null; avatar_url: string | null } | null
}

export type FeedComment = {
  id: string
  post_id: string
  user_id: string
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  // joined
  author?: { display_name: string | null; avatar_url: string | null } | null
}

const FEED_POST_SELECT = `
  *,
  product:products(id, name, slug, product_images(url, sort_order)),
  author:user_profiles(display_name, avatar_url)
`

export async function getFeedPosts(page = 1, limit = 10): Promise<FeedPost[]> {
  try {
    const supabase = await createClient()
    const from = (page - 1) * limit
    const to = page * limit - 1

    const { data, error } = await supabase
      .from('feed_posts')
      .select(FEED_POST_SELECT)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to)

    if (error) return []
    return (data as FeedPost[]) ?? []
  } catch {
    return []
  }
}

export async function getAllFeedPostsAdmin(): Promise<FeedPost[]> {
  try {
    const supabase = getAdminClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from('feed_posts')
      .select(FEED_POST_SELECT)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data as FeedPost[]) ?? []
  } catch {
    return []
  }
}

export async function getFeedPostById(id: string): Promise<FeedPost | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('feed_posts')
      .select(FEED_POST_SELECT)
      .eq('id', id)
      .single()

    if (error) return null
    return data as FeedPost
  } catch {
    return null
  }
}

export async function createFeedPost(data: {
  type: FeedPostType
  title: string
  body?: string
  image_url?: string
  product_id?: string
  is_published?: boolean
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) return { ok: false, error: 'Not authorized' }

    const insertData: Record<string, unknown> = {
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      image_url: data.image_url ?? null,
      product_id: data.product_id ?? null,
      author_id: user.id,
      is_published: data.is_published ?? false,
    }

    if (data.is_published) {
      insertData.published_at = new Date().toISOString()
    }

    const { data: newPost, error: insertError } = await supabase
      .from('feed_posts')
      .insert(insertData)
      .select('id')
      .single()

    if (insertError) return { ok: false, error: insertError.message }

    revalidatePath('/')
    revalidatePath('/feed')

    return { ok: true, id: newPost.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateFeedPost(
  id: string,
  data: {
    type?: FeedPostType
    title?: string
    body?: string | null
    image_url?: string | null
    product_id?: string | null
    is_published?: boolean
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) return { ok: false, error: 'Not authorized' }

    const updateData: Record<string, unknown> = { ...data }

    if (data.is_published === true) {
      const { data: existing, error: fetchError } = await supabase
        .from('feed_posts')
        .select('is_published, published_at')
        .eq('id', id)
        .single()

      if (!fetchError && existing && !existing.is_published) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { error: updateError } = await supabase.from('feed_posts').update(updateData).eq('id', id)

    if (updateError) return { ok: false, error: updateError.message }

    revalidatePath('/')
    revalidatePath('/feed')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteFeedPost(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) return { ok: false, error: 'Not authorized' }

    const { error: deleteError } = await supabase.from('feed_posts').delete().eq('id', id)

    if (deleteError) return { ok: false, error: deleteError.message }

    revalidatePath('/')
    revalidatePath('/feed')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function toggleLike(
  postId: string
): Promise<{ ok: boolean; liked: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, liked: false, error: 'Not authenticated' }

    const { data: existing, error: fetchError } = await supabase
      .from('feed_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) return { ok: false, liked: false, error: fetchError.message }

    if (existing) {
      const { error: deleteError } = await supabase
        .from('feed_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (deleteError) return { ok: false, liked: false, error: deleteError.message }
      return { ok: true, liked: false }
    } else {
      const { error: insertError } = await supabase
        .from('feed_post_likes')
        .insert({ post_id: postId, user_id: user.id })

      if (insertError) return { ok: false, liked: false, error: insertError.message }
      return { ok: true, liked: true }
    }
  } catch (err) {
    return { ok: false, liked: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function getUserLikedPosts(postIds: string[]): Promise<string[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('feed_post_likes')
      .select('post_id')
      .in('post_id', postIds)
      .eq('user_id', user.id)

    if (error) return []
    return (data ?? []).map((row: { post_id: string }) => row.post_id)
  } catch {
    return []
  }
}

export async function addComment(
  postId: string,
  body: string
): Promise<{ ok: boolean; error?: string; comment?: FeedComment }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const trimmed = body.trim()
    if (!trimmed) return { ok: false, error: 'Comment cannot be empty' }
    if (trimmed.length > 2000)
      return { ok: false, error: 'Comment must be 2000 characters or fewer' }

    const { data: inserted, error: insertError } = await supabase
      .from('feed_post_comments')
      .insert({ post_id: postId, user_id: user.id, body: trimmed })
      .select('id')
      .single()

    if (insertError) return { ok: false, error: insertError.message }

    const { data: comment, error: fetchError } = await supabase
      .from('feed_post_comments')
      .select('*, author:user_profiles(display_name, avatar_url)')
      .eq('id', inserted.id)
      .single()

    if (fetchError) return { ok: false, error: fetchError.message }

    return { ok: true, comment: comment as FeedComment }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function getComments(postId: string): Promise<FeedComment[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('feed_post_comments')
      .select('*, author:user_profiles(display_name, avatar_url)')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) return []
    return (data as FeedComment[]) ?? []
  } catch {
    return []
  }
}

export async function deleteComment(commentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const { data: comment, error: fetchError } = await supabase
      .from('feed_post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) return { ok: false, error: 'Comment not found' }

    const isOwner = comment.user_id === user.id

    if (!isOwner) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.is_admin) {
        return { ok: false, error: 'Not authorized' }
      }
    }

    const { error: updateError } = await supabase
      .from('feed_post_comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (updateError) return { ok: false, error: updateError.message }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
