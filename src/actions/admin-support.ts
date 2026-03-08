'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'
import type { TicketStatus, SupportTicket, TicketMessage } from './support'

const PER_PAGE = 20

export type AdminTicket = SupportTicket & {
  user_email: string | null
  user_display_name: string | null
}

export async function getAdminTickets({
  page = 1,
  status,
}: {
  page?: number
  status?: TicketStatus | 'all'
}) {
  const admin = await getAdminUser()
  if (!admin) return { data: [], count: 0, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { data: [], count: 0, error: 'Server misconfiguration' }

  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('support_tickets')
    .select('id, user_id, subject, category, status, created_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: tickets, count, error } = await query

  if (error || !tickets) return { data: [], count: 0, error: error?.message }

  // Enrich with user info from auth + profiles
  const userIds = [...new Set(tickets.map((t) => t.user_id))]

  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase.from('user_profiles').select('id, display_name').in('id', userIds),
  ])

  const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? null]))
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? null]))

  const enriched: AdminTicket[] = tickets.map((t) => ({
    ...(t as SupportTicket),
    user_email: emailMap.get(t.user_id) ?? null,
    user_display_name: nameMap.get(t.user_id) ?? null,
  }))

  return { data: enriched, count: count ?? 0, error: null }
}

export async function getAdminTicketWithMessages(ticketId: string) {
  const admin = await getAdminUser()
  if (!admin) return null

  const supabase = getAdminClient()
  if (!supabase) return null

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, user_id, subject, category, status, created_at, updated_at')
    .eq('id', ticketId)
    .single()

  if (!ticket) return null

  const [{ data: messages }, authResult, { data: profileData }] = await Promise.all([
    supabase
      .from('ticket_messages')
      .select('id, ticket_id, user_id, is_admin_reply, message, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
    supabase.auth.admin.getUserById(ticket.user_id),
    supabase.from('user_profiles').select('display_name').eq('id', ticket.user_id).single(),
  ])

  return {
    ticket: ticket as SupportTicket,
    messages: (messages ?? []) as TicketMessage[],
    user: {
      email: authResult.data.user?.email ?? null,
      display_name: profileData?.display_name ?? null,
    },
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const admin = await getAdminUser()
  if (!admin) return { ok: false as const, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false as const, error: 'Server misconfiguration' }

  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/support')
  revalidatePath(`/admin/support/${ticketId}`)
  return { ok: true as const }
}

export async function adminReplyToTicket(ticketId: string, message: string) {
  const admin = await getAdminUser()
  if (!admin) return { ok: false as const, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false as const, error: 'Server misconfiguration' }

  if (!message.trim()) return { ok: false as const, error: 'Message cannot be empty.' }

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    user_id: admin.id,
    is_admin_reply: true,
    message: message.trim(),
  })

  if (error) return { ok: false as const, error: error.message }

  // Auto-set status to in_progress if still open
  await supabase
    .from('support_tickets')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('status', 'open')

  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath('/admin/support')
  return { ok: true as const }
}
