import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { Mail } from 'lucide-react'
import { NewsletterActions } from './newsletter-actions'

type SearchParams = Promise<{ page?: string }>

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const perPage = 50
  const start = (page - 1) * perPage
  const end = start + perPage - 1

  const { data: subscribers, count } = await supabase
    .from('newsletter_subs')
    .select('id, email, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end)

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const rows = subscribers ?? []

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-50">Newsletter Subscribers</h1>
        </div>
        <NewsletterActions />
      </div>

      {/* Summary card */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-400">
          <span className="text-2xl font-bold text-zinc-50">{total}</span> total subscriber
          {total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-2 md:hidden">
        {rows.map((sub) => (
          <NewsletterActions.RowMobile
            key={sub.id}
            id={sub.id}
            email={sub.email}
            createdAt={sub.created_at}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden md:block">
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Subscribed
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((sub) => (
                <NewsletterActions.Row
                  key={sub.id}
                  id={sub.id}
                  email={sub.email}
                  createdAt={sub.created_at}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="mt-12 text-center text-zinc-500">No subscribers yet.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}`}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                ← Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}`}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
