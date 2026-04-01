'use server'

import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth-admin'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type BoardItemType = 'task' | 'idea'
export type TaskStatus = 'open' | 'in_progress' | 'done'
export type IdeaStatus = 'open' | 'validated' | 'discarded' | 'archived'
export type BoardItemStatus = TaskStatus | IdeaStatus
export type BoardItemPriority = 'low' | 'medium' | 'high'

export type BoardVote = {
  item_id: string
  user_id: string
  vote: 'up' | 'down'
}

export type BoardComment = {
  id: string
  item_id: string
  author_id: string
  body: string
  created_at: string
  author: { id: string; display_name: string | null } | null
}

export type BoardItem = {
  id: string
  type: BoardItemType
  title: string
  description: string | null
  url: string | null
  status: BoardItemStatus
  priority: BoardItemPriority
  created_by: string
  assigned_to: string | null
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  creator: { id: string; display_name: string | null } | null
  assignee: { id: string; display_name: string | null } | null
  completer: { id: string; display_name: string | null } | null
  votes: BoardVote[]
  comments: BoardComment[]
}

export type AdminProfile = {
  id: string
  display_name: string | null
}

async function getClient() {
  const admin = getAdminClient()
  if (admin) return admin
  return createClient()
}

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getBoardData(): Promise<{
  items: BoardItem[]
  admins: AdminProfile[]
  currentUserId: string
}> {
  const user = await requireAdmin()
  const db = await getClient()

  const [itemsRes, votesRes, commentsRes, adminsRes] = await Promise.all([
    db.from('admin_board_items').select(`
      *,
      creator:user_profiles!created_by(id, display_name),
      assignee:user_profiles!assigned_to(id, display_name),
      completer:user_profiles!completed_by(id, display_name)
    `).order('created_at', { ascending: false }),

    db.from('admin_board_votes').select('item_id, user_id, vote'),

    db.from('admin_board_comments').select(`
      id, item_id, author_id, body, created_at,
      author:user_profiles!author_id(id, display_name)
    `).order('created_at', { ascending: true }),

    db.from('user_profiles').select('id, display_name').eq('is_admin', true).order('display_name'),
  ])

  if (itemsRes.error) throw new Error(itemsRes.error.message)

  const votes = (votesRes.data ?? []) as BoardVote[]
  const comments = (commentsRes.data ?? []) as unknown as BoardComment[]

  const items: BoardItem[] = ((itemsRes.data ?? []) as unknown as Omit<BoardItem, 'votes' | 'comments'>[]).map((item) => ({
    ...item,
    votes: votes.filter((v) => v.item_id === item.id),
    comments: comments.filter((c) => c.item_id === item.id),
  }))

  return {
    items,
    admins: (adminsRes.data ?? []) as AdminProfile[],
    currentUserId: user.id,
  }
}

// ─── Board item CRUD ──────────────────────────────────────────────────────────

export async function createBoardItem(input: {
  type: BoardItemType
  title: string
  description?: string
  url?: string
  priority?: BoardItemPriority
  assigned_to?: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireAdmin()
    const db = await getClient()

    const { data, error } = await db
      .from('admin_board_items')
      .insert({
        type: input.type,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        url: input.url?.trim() || null,
        priority: input.priority ?? 'medium',
        assigned_to: input.assigned_to || null,
        created_by: user.id,
        status: 'open',
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateBoardItem(
  id: string,
  input: {
    title?: string
    description?: string | null
    url?: string | null
    priority?: BoardItemPriority
    assigned_to?: string | null
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const db = await getClient()

    const { error } = await db
      .from('admin_board_items')
      .update({
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.url !== undefined && { url: input.url?.trim() || null }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.assigned_to !== undefined && { assigned_to: input.assigned_to || null }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateBoardItemStatus(
  id: string,
  status: BoardItemStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireAdmin()
    const db = await getClient()

    const update: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'done' || status === 'validated') {
      update.completed_by = user.id
      update.completed_at = new Date().toISOString()
    } else if (status !== 'archived') {
      update.completed_by = null
      update.completed_at = null
    }

    const { error } = await db.from('admin_board_items').update(update).eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function convertIdeaToTask(
  ideaId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireAdmin()
    const db = await getClient()

    const { data: idea, error: fetchErr } = await db
      .from('admin_board_items')
      .select('title, description, url')
      .eq('id', ideaId)
      .single()

    if (fetchErr || !idea) return { ok: false, error: 'Idea not found' }

    const { data, error } = await db
      .from('admin_board_items')
      .insert({
        type: 'task',
        title: idea.title,
        description: idea.description
          ? `${idea.description}\n\n[Converted from idea]`
          : '[Converted from idea]',
        url: idea.url,
        priority: 'medium',
        status: 'open',
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteBoardItem(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const db = await getClient()
    const { error } = await db.from('admin_board_items').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export async function castVote(
  itemId: string,
  vote: 'up' | 'down' | null   // null = remove vote
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireAdmin()
    const db = await getClient()

    if (vote === null) {
      await db.from('admin_board_votes').delete()
        .eq('item_id', itemId).eq('user_id', user.id)
    } else {
      await db.from('admin_board_votes').upsert(
        { item_id: itemId, user_id: user.id, vote },
        { onConflict: 'item_id,user_id' }
      )
    }

    revalidatePath('/admin/board')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  itemId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireAdmin()
    if (!body.trim()) return { ok: false, error: 'Comment cannot be empty' }
    const db = await getClient()

    const { error } = await db.from('admin_board_comments').insert({
      item_id: itemId,
      author_id: user.id,
      body: body.trim(),
    })

    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteComment(
  commentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const db = await getClient()
    const { error } = await db.from('admin_board_comments').delete().eq('id', commentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/board')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
