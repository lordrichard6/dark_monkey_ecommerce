'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'

export type GalleryItem = {
  id: string
  title: string
  description: string | null
  image_url: string
  created_at: string
  tags: { id: string; name: string; slug: string }[]
  votes_count: number
  has_voted: boolean
}

// Public Actions

export async function getTags() {
  const supabase = await createClient()
  const { data } = await supabase.from('tags').select('*').order('name')
  return data || []
}

export async function createTag(
  name: string
): Promise<{ ok: true; tag: { id: string; name: string } } | { ok: false; error: string }> {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Admin not configured' }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if exists
    const { data: existing } = await supabase
      .from('tags')
      .select('id, name')
      .eq('slug', slug)
      .single()
    if (existing) return { ok: true, tag: existing }

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({ name, slug })
      .select('id, name')
      .single()

    if (error) return { ok: false, error: error.message }
    if (!tag) return { ok: false, error: 'Failed to create tag' }

    return { ok: true, tag }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function getGalleryItems(
  limit = 20,
  offset = 0,
  tagSlug?: string,
  fingerprint?: string
): Promise<{ items: GalleryItem[]; total: number }> {
  const supabase = await createClient()

  // We need to construct the query strictly.
  // Because of Supabase/PostgREST limitations with deep filtering and aggregates in one go,
  // sometimes it's easier to fetch raw and process, but for pagination we need count.

  // Base query
  let query = supabase
    .from('gallery_items')
    .select(
      `
      *,
      gallery_item_tags!left (
        tag:tags (
          id,
          name,
          slug
        )
      ),
      gallery_votes (count)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // If filtering by tag, we switch to !inner to filter out non-matching items
  if (tagSlug) {
    // NOTE: Filtering by nested relation property in supabase js is:
    // .eq('gallery_item_tags.tag.slug', tagSlug)
    // And we need !inner on gallery_item_tags.
    // However, modifying the select string dynamically is safer.
    query = supabase
      .from('gallery_items')
      .select(
        `
          *,
          gallery_item_tags!inner (
            tag:tags (
              id,
              name,
              slug
            )
          ),
          gallery_votes (count)
        `,
        { count: 'exact' }
      )
      .eq('gallery_item_tags.tag.slug', tagSlug)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching gallery items:', error)
    return { items: [], total: 0 }
  }

  // Get current user for vote check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Transform data
  const items: GalleryItem[] = []

  // Optimization: Fetch all relevant votes for this batch of items in one query instead of N+1
  const itemIds = (data as { id: string }[]).map((i) => i.id)
  const userVotesMap = new Set<string>()

  if (itemIds.length > 0) {
    if (user) {
      // Fetch votes by this user for these items in last 24h
      const { data: myVotes } = await supabase
        .from('gallery_votes')
        .select('item_id')
        .eq('user_id', user.id)
        .in('item_id', itemIds)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      myVotes?.forEach((v: { item_id: string }) => userVotesMap.add(v.item_id))
    } else if (fingerprint) {
      // Fetch votes by this fingerprint for these items (All time? Or 24h?)
      // Requirement: "Saved in cookies ... not able to vote many times".
      // Assuming persistent block for guests for simplicity, or we can use 24h too.
      // Let's implement PERMANENT block for guests to prevent spam,
      // or match the user policy (24h).
      // Prompt says: "If the user is logged in... He can only vote once a day."
      // For guests: "Not able to vote many times."
      // I'll stick to 1 vote per item EVER for guests (cookie/fingerprint based) to be safe against spam,
      // as they can clear cookies/fingerprint easily anyway.
      // If I want to be consistent, I can say once per day for everyone.
      // Let's go with 24h for everyone for consistency.

      const { data: myVotes } = await supabase
        .from('gallery_votes')
        .select('item_id')
        .eq('fingerprint', fingerprint)
        .in('item_id', itemIds)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      myVotes?.forEach((v: { item_id: string }) => userVotesMap.add(v.item_id))
    }
  }

  type RawGalleryItem = {
    id: string
    title: string
    description: string | null
    image_url: string
    created_at: string
    gallery_item_tags: { tag: { id: string; name: string; slug: string } | null }[]
    gallery_votes: { count: number }[]
  }

  for (const item of data as RawGalleryItem[]) {
    // Filter out null tags (from left join if any)
    const tags = item.gallery_item_tags
      .map((t) => t.tag)
      .filter((t): t is { id: string; name: string; slug: string } => t !== null)

    // Get count
    const votesCount = item.gallery_votes?.[0]?.count || 0

    // URL Regeneration Logic:
    // If the URL is from Supabase Storage, we regenerate it using the CURRENT environment's URL.
    // This fixes issues where images uploaded on localhost (127.0.0.1) break on production, or vice versa.
    let imageUrl = item.image_url
    try {
      if (imageUrl && imageUrl.includes('/storage/v1/object/public/')) {
        // Extract the path after the bucket name (product-images)
        // Format: .../product-images/gallery/filename.png
        // We want: gallery/filename.png
        const parts = imageUrl.split('/product-images/')
        if (parts.length > 1) {
          const filePath = parts[1]
          // Generate fresh URL using current client config
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath)
          imageUrl = urlData.publicUrl
        }
      }
    } catch (e) {
      console.warn('Failed to regenerate gallery URL:', e)
    }

    items.push({
      id: item.id,
      title: item.title,
      description: item.description,
      image_url: imageUrl,
      created_at: item.created_at,
      tags,
      votes_count: votesCount,
      has_voted: userVotesMap.has(item.id),
    })
  }

  return { items, total: count || 0 }
}

export async function voteForItem(
  itemId: string,
  fingerprint?: string
): Promise<{ ok: boolean; error?: string }> {
  // We use a fresh client to ensure we get the latest session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // RLS allows inserts, but we want to prevent duplicates/spam logic here

  if (user) {
    // Check for recent vote
    const { count } = await supabase
      .from('gallery_votes')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .gt('created_at', oneDayAgo)

    if ((count || 0) > 0) {
      return { ok: false, error: 'You can only vote once every 24 hours for this item.' }
    }

    const { error } = await supabase.from('gallery_votes').insert({
      item_id: itemId,
      user_id: user.id,
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } else {
    // Guest
    if (!fingerprint) return { ok: false, error: 'Browser fingerprint required.' }

    // Check for recent vote (24h or forever? Let's use 24h for consistency)
    const { count } = await supabase
      .from('gallery_votes')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
      .eq('fingerprint', fingerprint)
      //.gt('created_at', oneDayAgo) // Uncomment to allow daily voting for guests
      // If we want "not able to vote many times" strictly, maybe strictly 1 vote.
      // But cookies can be cleared.
      // Let's enforce 24h limit.
      .gt('created_at', oneDayAgo)

    if ((count || 0) > 0) {
      return { ok: false, error: 'You have already voted for this item today.' }
    }

    const { error } = await supabase.from('gallery_votes').insert({
      item_id: itemId,
      fingerprint: fingerprint,
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }
}

// Admin Actions

export async function uploadGalleryItem(
  formData: FormData,
  tagIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!file) return { ok: false, error: 'No file provided' }
  if (!title) return { ok: false, error: 'Title is required' }

  // Compress & convert to WebP using sharp (server-side)
  const buffer = Buffer.from(await file.arrayBuffer())
  const compressed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const filename = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filename, compressed, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename)
  const publicUrl = urlData.publicUrl

  // Insert Item
  const { data: item, error: insertError } = await supabase
    .from('gallery_items')
    .insert({
      title,
      description: description || null,
      image_url: publicUrl,
    })
    .select('id')
    .single()

  if (insertError || !item) {
    // cleanup
    await supabase.storage.from('product-images').remove([filename])
    return { ok: false, error: insertError?.message || 'Failed to create item' }
  }

  // Insert Tags
  if (tagIds.length > 0) {
    const { error: tagError } = await supabase.from('gallery_item_tags').insert(
      tagIds.map((tagId) => ({
        item_id: item.id,
        tag_id: tagId,
      }))
    )

    if (tagError) {
      console.error('Failed to add tags:', tagError)
      // Cleanup: remove image and item since tags are required for proper display
      await supabase.from('gallery_items').delete().eq('id', item.id)
      await supabase.storage.from('product-images').remove([filename])
      return { ok: false, error: 'Failed to attach tags to gallery item' }
    }
  }

  revalidatePath('/art')
  revalidatePath('/admin/gallery')
  return { ok: true }
}

export async function deleteGalleryItem(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  // Get item to find image url
  const { data: item } = await supabase
    .from('gallery_items')
    .select('image_url')
    .eq('id', id)
    .single()

  // Delete from DB
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Delete image
  if (item && item.image_url) {
    try {
      const path = item.image_url.split('/product-images/')[1]
      if (path) {
        await supabase.storage.from('product-images').remove([path])
      }
    } catch (err) {
      console.error('Failed to cleanup image', err)
    }
  }

  revalidatePath('/art')
  revalidatePath('/admin/gallery')
  return { ok: true }
}
