'use server'

import { getAdminUser } from '@/lib/auth-admin'
import { getAdminClient } from '@/lib/supabase/admin'

export interface AdminNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

/** Fetch the 30 most recent notifications. Admin only. */
export async function getAdminNotifications(): Promise<{
  ok: boolean
  notifications?: AdminNotification[]
  unreadCount?: number
  error?: string
}> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'DB not configured' }

  const [listResult, countResult] = await Promise.all([
    supabase
      .from('admin_notifications')
      .select('id, type, title, body, data, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
  ])

  if (listResult.error) return { ok: false, error: listResult.error.message }

  const notifications = (listResult.data ?? []) as AdminNotification[]
  const unreadCount = countResult.error ? 0 : (countResult.count ?? 0)

  return { ok: true, notifications, unreadCount }
}

/** Mark all notifications as read. Admin only. */
export async function markAllNotificationsRead(): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'DB not configured' }

  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Mark a single notification as read. Admin only. */
export async function markNotificationRead(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'DB not configured' }

  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
