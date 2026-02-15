'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Announcement = {
    id: string
    text: string
    url: string | null
    active: boolean
    position: number
    created_at: string
}

export async function getAnnouncements() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

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

export async function createAnnouncement(data: { text: string; url?: string; active?: boolean }) {
    const supabase = await createClient()

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
        position
    })

    if (error) {
        console.error('Error creating announcement:', error)
        return { error: 'Failed to create announcement' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Error updating announcement:', error)
        return { error: 'Failed to update announcement' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function deleteAnnouncement(id: string) {
    const supabase = await createClient()

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
