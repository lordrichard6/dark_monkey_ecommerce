import { notFound, redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth-admin'
import {
  getAdminTicketWithMessages,
  adminReplyToTicket,
  updateTicketStatus,
} from '@/actions/admin-support'
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge'
import { TicketCategoryBadge } from '@/components/support/TicketCategoryBadge'
import { TicketThread } from '@/components/support/TicketThread'
import { ReplyForm } from '@/components/support/ReplyForm'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import type { TicketStatus, TicketCategory } from '@/actions/support'

type Props = {
  params: Promise<{ id: string }>
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order_issue: 'Order Issue',
  complaint: 'Complaint',
  suggestion: 'Suggestion',
  question: 'Question',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const NEXT_STATUSES: Partial<
  Record<TicketStatus, { value: TicketStatus; label: string; style: string }[]>
> = {
  open: [
    {
      value: 'in_progress',
      label: 'Mark In Progress',
      style: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
    },
  ],
  in_progress: [
    {
      value: 'resolved',
      label: 'Mark Resolved',
      style: 'border-green-500/30 text-green-400 hover:bg-green-500/10',
    },
    {
      value: 'closed',
      label: 'Close Ticket',
      style: 'border-zinc-600 text-zinc-400 hover:bg-zinc-800',
    },
  ],
  resolved: [
    {
      value: 'closed',
      label: 'Close Ticket',
      style: 'border-zinc-600 text-zinc-400 hover:bg-zinc-800',
    },
    {
      value: 'open',
      label: 'Reopen',
      style: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
    },
  ],
  closed: [
    {
      value: 'open',
      label: 'Reopen',
      style: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
    },
  ],
}

export default async function AdminTicketDetailPage({ params }: Props) {
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const { id } = await params
  const result = await getAdminTicketWithMessages(id)
  if (!result) notFound()

  const { ticket, messages, user } = result

  async function handleReply(message: string) {
    'use server'
    return adminReplyToTicket(id, message)
  }

  async function handleStatusChange(status: TicketStatus) {
    'use server'
    return updateTicketStatus(id, status)
  }

  const nextStatuses = NEXT_STATUSES[ticket.status as TicketStatus] ?? []

  return (
    <div className="p-8">
      <Link
        href="/admin/support"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main thread */}
        <div>
          {/* Ticket header */}
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-zinc-50">{ticket.subject}</h1>
              <TicketStatusBadge
                status={ticket.status as TicketStatus}
                label={STATUS_LABELS[ticket.status as TicketStatus]}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              <TicketCategoryBadge
                category={ticket.category as TicketCategory}
                label={CATEGORY_LABELS[ticket.category as TicketCategory]}
              />
              <span>#{ticket.id.slice(0, 8).toUpperCase()}</span>
              <span>
                Opened{' '}
                {new Date(ticket.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Thread */}
          <div className="mb-6">
            <TicketThread messages={messages} youLabel="Support Team" adminLabel="Support Team" />
          </div>

          {/* Admin reply */}
          <ReplyForm
            onSubmit={handleReply}
            placeholder="Type your reply to the customer..."
            label="Send Reply"
            disabled={ticket.status === 'closed'}
            disabledMessage="This ticket is closed. Reopen it to reply."
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Customer
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {user.display_name ?? 'Unknown'}
                </p>
                <p className="text-xs text-zinc-500">{user.email ?? '—'}</p>
              </div>
            </div>
            {user.email && (
              <Link
                href={`/admin/customers`}
                className="mt-3 block text-xs text-amber-400 hover:text-amber-300 transition"
              >
                View customer →
              </Link>
            )}
          </div>

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Actions
              </p>
              <div className="space-y-2">
                {nextStatuses.map((next) => (
                  <form
                    key={next.value}
                    action={async () => {
                      'use server'
                      await handleStatusChange(next.value)
                    }}
                  >
                    <button
                      type="submit"
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition ${next.style}`}
                    >
                      {next.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
