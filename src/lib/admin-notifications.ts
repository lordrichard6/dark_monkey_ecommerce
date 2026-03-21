import { getAdminClient } from './supabase/admin'

export type AdminNotificationType = 'order' | 'signup' | 'support'

export interface CreateNotificationPayload {
  type: AdminNotificationType
  title: string
  body?: string
  data?: Record<string, unknown>
}

/**
 * Inserts a notification into the admin_notifications table.
 * Non-fatal — errors are logged but never thrown, so callers are never blocked.
 */
export async function createAdminNotification(payload: CreateNotificationPayload): Promise<void> {
  const supabase = getAdminClient()
  if (!supabase) return

  const { error } = await supabase.from('admin_notifications').insert({
    type: payload.type,
    title: payload.title,
    body: payload.body ?? '',
    data: payload.data ?? {},
  })

  if (error) {
    console.error('[AdminNotification] Failed to insert:', error.message)
  }
}
