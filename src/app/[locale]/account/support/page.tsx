import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTickets } from '@/actions/support'
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge'
import { TicketCategoryBadge } from '@/components/support/TicketCategoryBadge'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Plus, Inbox } from 'lucide-react'
import type { TicketStatus, TicketCategory } from '@/actions/support'

export default async function AccountSupportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/account/support')

  const t = await getTranslations('support')
  const tickets = await getUserTickets()

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{t('title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('supportDesc')}</p>
        </div>
        <Link
          href="/account/support/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          {t('newTicket')}
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-20 text-center">
          <Inbox className="mb-4 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-300 font-medium">{t('noTickets')}</p>
          <p className="mt-1 text-sm text-zinc-500">{t('noTicketsDesc')}</p>
          <Link
            href="/account/support/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            {t('newTicket')}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {t('subject')}
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
                  {t('category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 md:table-cell">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="group transition hover:bg-zinc-900/40">
                  <td className="px-4 py-4">
                    <Link
                      href={`/account/support/${ticket.id}`}
                      className="font-medium text-zinc-100 hover:text-amber-400 transition"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <TicketCategoryBadge
                      category={ticket.category as TicketCategory}
                      label={t(`cat_${ticket.category}` as `cat_${TicketCategory}`)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <TicketStatusBadge
                      status={ticket.status as TicketStatus}
                      label={t(`status_${ticket.status}` as `status_${TicketStatus}`)}
                    />
                  </td>
                  <td className="hidden px-4 py-4 text-zinc-500 md:table-cell">
                    {formatDate(ticket.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
