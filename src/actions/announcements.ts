'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export type Announcement = {
  id: string
  text: string
  url: string | null
  active: boolean
  position: number
  created_at: string
  expires_at: string | null
  variant: 'default' | 'info' | 'promo' | 'warning'
  locale: string | null
}

export async function getAnnouncements(locale?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (locale) {
    query = query.or(`locale.is.null,locale.eq.${locale}`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching announcements:', error)
    return []
  }

  return data as Announcement[]
}

export async function getAllAnnouncements() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all announcements:', error)
    return []
  }

  return data as Announcement[]
}

export async function createAnnouncement(data: {
  text: string
  url?: string
  active?: boolean
  expires_at?: string | null
  variant?: 'default' | 'info' | 'promo' | 'warning'
  locale?: string | null
}) {
  const admin = await getAdminUser()
  if (!admin) return { error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { error: 'Server misconfiguration' }

  // Get max position to append to end
  const { data: maxPosData } = await supabase
    .from('announcements')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (maxPosData?.position ?? -1) + 1

  const { error } = await supabase.from('announcements').insert({
    text: data.text,
    url: data.url || null,
    active: data.active ?? true,
    position,
    expires_at: data.expires_at || null,
    variant: data.variant || 'default',
    locale: data.locale || null,
  })

  if (error) {
    console.error('Error creating announcement:', error)
    return { error: 'Failed to create announcement' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
  const admin = await getAdminUser()
  if (!admin) return { error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { error: 'Server misconfiguration' }

  const { error } = await supabase.from('announcements').update(data).eq('id', id)

  if (error) {
    console.error('Error updating announcement:', error)
    return { error: 'Failed to update announcement' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteAnnouncement(id: string) {
  const admin = await getAdminUser()
  if (!admin) return { error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { error: 'Server misconfiguration' }

  const { error } = await supabase.from('announcements').delete().eq('id', id)

  if (error) {
    console.error('Error deleting announcement:', error)
    return { error: 'Failed to delete announcement' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function toggleAnnouncementActive(id: string, active: boolean) {
  return updateAnnouncement(id, { active })
}

export async function reorderAnnouncements(orderedIds: string[]): Promise<{ success: boolean }> {
  const admin = await getAdminUser()
  if (!admin) return { success: false }

  const supabase = getAdminClient()
  if (!supabase) return { success: false }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('announcements')
      .update({ position: i })
      .eq('id', orderedIds[i])
    if (error) {
      console.error(`Error reordering announcement ${orderedIds[i]}:`, error)
      return { success: false }
    }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function bulkDeleteAnnouncements(ids: string[]): Promise<{ success: boolean }> {
  const admin = await getAdminUser()
  if (!admin) return { success: false }

  const supabase = getAdminClient()
  if (!supabase) return { success: false }

  const { error } = await supabase.from('announcements').delete().in('id', ids)

  if (error) {
    console.error('Error bulk deleting announcements:', error)
    return { success: false }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function bulkToggleAnnouncements(
  ids: string[],
  active: boolean
): Promise<{ success: boolean }> {
  const admin = await getAdminUser()
  if (!admin) return { success: false }

  const supabase = getAdminClient()
  if (!supabase) return { success: false }

  const { error } = await supabase.from('announcements').update({ active }).in('id', ids)

  if (error) {
    console.error('Error bulk toggling announcements:', error)
    return { success: false }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
