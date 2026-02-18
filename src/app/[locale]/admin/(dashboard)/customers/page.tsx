import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { Users } from 'lucide-react'

type SearchParams = Promise<{ page?: string }>

function formatPrice(cents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function TierBadge({ tier }: { tier: string | null }) {
  const map: Record<string, string> = {
    bronze: 'bg-amber-900/30 text-amber-600 ring-amber-700/30',
    silver: 'bg-zinc-500/20 text-zinc-300 ring-zinc-500/20',
    gold: 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/20',
    platinum: 'bg-purple-500/20 text-purple-400 ring-purple-500/20',
  }
  const t = tier ?? 'bronze'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${map[t] ?? map.bronze}`}
    >
      {t}
    </span>
  )
}

export default async function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const perPage = 20

  // Fetch auth users (paginated, includes email)
  const { data: authData } = await supabase.auth.admin.listUsers({ page, perPage })
  const authUsers = authData?.users ?? []
  const total =
    authData && 'total' in authData ? (authData as { total: number }).total : authUsers.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  // Batch-fetch matching user_profiles
  const userIds = authUsers.map((u) => u.id)
  const { data: profiles } = userIds.length
    ? await supabase
        .from('user_profiles')
        .select(
          'id, display_name, avatar_url, current_tier, total_orders, total_spent_cents, total_xp, created_at'
        )
        .in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const customers = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? '—',
    createdAt: u.created_at,
    profile: profileMap.get(u.id) ?? null,
  }))

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-50">Customers</h1>
        </div>
        <span className="text-sm text-zinc-500">{total} total</span>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:bg-zinc-800/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-400">
                  {(c.profile?.display_name ?? c.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-zinc-50">{c.profile?.display_name ?? '—'}</p>
                  <p className="text-xs text-zinc-400">{c.email}</p>
                </div>
              </div>
              <TierBadge tier={c.profile?.current_tier ?? null} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
              <span>{c.profile?.total_orders ?? 0} orders</span>
              <span>{formatPrice(c.profile?.total_spent_cents ?? 0)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden md:block">
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tier
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Orders
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-400">
                        {(c.profile?.display_name ?? c.email)[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-50 group-hover:text-amber-400 transition-colors">
                        {c.profile?.display_name ?? '—'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{c.email}</td>
                  <td className="px-4 py-3">
                    <TierBadge tier={c.profile?.current_tier ?? null} />
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300">
                    {c.profile?.total_orders ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-100">
                    {formatPrice(c.profile?.total_spent_cents ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}

      {customers.length === 0 && (
        <div className="mt-12 text-center text-zinc-500">No customers found.</div>
      )}
    </div>
  )
}
