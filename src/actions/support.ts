'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminNotification } from '@/lib/admin-notifications'

export type TicketCategory = 'order_issue' | 'complaint' | 'suggestion' | 'question'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type SupportTicket = {
  id: string
  user_id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  created_at: string
  updated_at: string
}

export type TicketMessage = {
  id: string
  ticket_id: string
  user_id: string | null
  is_admin_reply: boolean
  message: string
  created_at: string
}

export async function createTicket(subject: string, category: TicketCategory, message: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Unauthorized' }

  if (!subject.trim() || !message.trim()) {
    return { ok: false as const, error: 'Subject and message are required.' }
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({ user_id: user.id, subject: subject.trim(), category })
    .select('id')
    .single()

  if (ticketError || !ticket) {
    return { ok: false as const, error: 'Failed to create ticket.' }
  }

  const { error: msgError } = await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id,
    user_id: user.id,
    is_admin_reply: false,
    message: message.trim(),
  })

  if (msgError) {
    return { ok: false as const, error: 'Failed to save message.' }
  }

  // Must be awaited before redirect() — redirect() throws immediately and a floating
  // Promise would never resolve in a serverless environment.
  await createAdminNotification({
    type: 'support',
    title: `New support ticket — ${category.replaceAll('_', ' ')}`,
    body: subject.trim(),
    data: { ticketId: ticket.id, category },
  })

  revalidatePath('/account/support')
  redirect(`/account/support/${ticket.id}`)
}

export async function replyToTicket(ticketId: string, message: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Unauthorized' }

  if (!message.trim()) return { ok: false as const, error: 'Message cannot be empty.' }

  // Verify ticket belongs to user and is not closed
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single()

  if (!ticket) return { ok: false as const, error: 'Ticket not found.' }
  if (ticket.status === 'closed') return { ok: false as const, error: 'This ticket is closed.' }

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    user_id: user.id,
    is_admin_reply: false,
    message: message.trim(),
  })

  if (error) return { ok: false as const, error: 'Failed to send reply.' }

  createAdminNotification({
    type: 'support',
    title: 'Customer replied to support ticket',
    body: message.trim().slice(0, 120),
    data: { ticketId },
  }).catch(() => {})

  revalidatePath(`/account/support/${ticketId}`)
  return { ok: true as const }
}

export async function getUserTickets() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('support_tickets')
    .select('id, subject, category, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (data ?? []) as SupportTicket[]
}

export async function getTicketWithMessages(ticketId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, subject, category, status, created_at, updated_at')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single()

  if (!ticket) return null

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, ticket_id, user_id, is_admin_reply, message, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  return { ticket: ticket as SupportTicket, messages: (messages ?? []) as TicketMessage[] }
}
