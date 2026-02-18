'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function deleteNewsletterSubscriber(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin client not configured' }

  const { error } = await supabase.from('newsletter_subs').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/newsletter')
  return { ok: true }
}

export async function getAllSubscriberEmails(): Promise<string[]> {
  const admin = await getAdminUser()
  if (!admin) return []

  const supabase = getAdminClient()
  if (!supabase) return []

  const { data } = await supabase
    .from('newsletter_subs')
    .select('email')
    .order('created_at', { ascending: false })

  return (data ?? []).map((r) => r.email)
}
