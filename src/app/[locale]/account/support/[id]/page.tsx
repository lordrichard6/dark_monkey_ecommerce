import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTicketWithMessages, replyToTicket } from '@/actions/support'
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge'
import { TicketCategoryBadge } from '@/components/support/TicketCategoryBadge'
import { TicketThread } from '@/components/support/TicketThread'
import { ReplyForm } from '@/components/support/ReplyForm'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import type { TicketStatus, TicketCategory } from '@/actions/support'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/account/support')

  const t = await getTranslations('support')
  const result = await getTicketWithMessages(id)
  if (!result) notFound()

  const { ticket, messages } = result
  const isClosed = ticket.status === 'closed'

  async function handleReply(message: string) {
    'use server'
    return replyToTicket(id, message)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/account/support"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToTickets')}
      </Link>

      {/* Ticket header */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-zinc-50">{ticket.subject}</h1>
          <TicketStatusBadge
            status={ticket.status as TicketStatus}
            label={t(`status_${ticket.status}` as `status_${TicketStatus}`)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <TicketCategoryBadge
            category={ticket.category as TicketCategory}
            label={t(`cat_${ticket.category}` as `cat_${TicketCategory}`)}
          />
          <span className="text-xs text-zinc-500">#{ticket.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* Message thread */}
      <div className="mb-6">
        <TicketThread messages={messages} youLabel={t('you')} adminLabel={t('adminReply')} />
      </div>

      {/* Reply */}
      <ReplyForm
        onSubmit={handleReply}
        placeholder={t('messagePlaceholder')}
        label={t('reply')}
        disabled={isClosed}
        disabledMessage={t('ticketClosed')}
      />
    </div>
  )
}
