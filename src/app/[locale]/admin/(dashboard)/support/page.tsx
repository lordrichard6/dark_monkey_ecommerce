import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth-admin'
import { getAdminTickets } from '@/actions/admin-support'
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge'
import { TicketCategoryBadge } from '@/components/support/TicketCategoryBadge'
import Link from 'next/link'
import type { TicketStatus, TicketCategory } from '@/actions/support'

const STATUS_TABS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

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

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminSupportPage({ searchParams }: Props) {
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const { page: pageStr, status } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const activeStatus = (status as TicketStatus | 'all') ?? 'all'

  const { data: tickets, count } = await getAdminTickets({ page, status: activeStatus })
  const totalPages = Math.ceil((count ?? 0) / 20)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Support Tickets</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage and respond to customer support requests.
        </p>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/admin/support' : `/admin/support?status=${tab.value}`}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeStatus === tab.value
                ? 'bg-zinc-700 text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-500">
          No tickets found.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Subject
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
                    Customer
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 md:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 lg:table-cell">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="group transition hover:bg-zinc-900/40">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="font-medium text-zinc-100 hover:text-amber-400 transition"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        #{ticket.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <p className="text-zinc-300">{ticket.user_display_name ?? '—'}</p>
                      <p className="text-xs text-zinc-500">{ticket.user_email ?? ''}</p>
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      <TicketCategoryBadge
                        category={ticket.category as TicketCategory}
                        label={CATEGORY_LABELS[ticket.category as TicketCategory]}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <TicketStatusBadge
                        status={ticket.status as TicketStatus}
                        label={STATUS_LABELS[ticket.status as TicketStatus]}
                      />
                    </td>
                    <td className="hidden px-4 py-4 text-zinc-500 lg:table-cell">
                      {formatDate(ticket.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
              <span>{count} total</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/support?page=${page - 1}${activeStatus !== 'all' ? `&status=${activeStatus}` : ''}`}
                    className="rounded-md border border-zinc-700 px-3 py-1.5 hover:border-zinc-500 hover:text-zinc-200 transition"
                  >
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/support?page=${page + 1}${activeStatus !== 'all' ? `&status=${activeStatus}` : ''}`}
                    className="rounded-md border border-zinc-700 px-3 py-1.5 hover:border-zinc-500 hover:text-zinc-200 transition"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
