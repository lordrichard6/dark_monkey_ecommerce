import Link from 'next/link'
import Image from 'next/image'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import {
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ShoppingBag,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import { CustomersFilterBar } from './customers-filter-bar'
import { CustomersViewToggle } from './customers-view-toggle'

type SearchParams = Promise<{
  page?: string
  search?: string
  tier?: string
  emailStatus?: string
  sort?: string
  sortDir?: string
  view?: string
}>

const VALID_SORT_COLS = ['created_at', 'total_spent_cents', 'total_orders'] as const
type SortCol = (typeof VALID_SORT_COLS)[number]

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

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-zinc-600" />
  return dir === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-amber-400" />
  ) : (
    <ArrowDown className="h-3 w-3 text-amber-400" />
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

  const {
    page: pageParam,
    search,
    tier,
    emailStatus,
    sort: sortParam,
    sortDir: sortDirParam,
    view: viewParam,
  } = await searchParams

  const view: 'table' | 'grid' = viewParam === 'grid' ? 'grid' : 'table'

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const perPage = 20
  const sort: SortCol = VALID_SORT_COLS.includes(sortParam as SortCol)
    ? (sortParam as SortCol)
    : 'created_at'
  const sortDir: 'asc' | 'desc' = sortDirParam === 'asc' ? 'asc' : 'desc'

  // ── Phase 1: fetch all auth users for enrichment + filtering (works up to ~1000 users) ──
  const authMap = new Map<string, { email: string; emailConfirmed: boolean; createdAt: string }>()
  try {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    for (const u of data?.users ?? []) {
      authMap.set(u.id, {
        email: u.email ?? '—',
        emailConfirmed: !!u.email_confirmed_at,
        createdAt: u.created_at,
      })
    }
  } catch {
    // auth admin unavailable — enrichment skipped, profiles still shown
  }

  // ── Phase 2: compute ID filter from auth data (email search + email status) ──
  const isEmailSearch = !!(search && search.includes('@'))
  let authFilterIds: string[] | null = null

  if (emailStatus || isEmailSearch) {
    const matched = [...authMap.entries()].filter(([_, u]) => {
      if (emailStatus === 'verified' && !u.emailConfirmed) return false
      if (emailStatus === 'unverified' && u.emailConfirmed) return false
      if (isEmailSearch && !u.email.toLowerCase().includes(search!.toLowerCase())) return false
      return true
    })
    authFilterIds = matched.map(([id]) => id)
  }

  // ── Phase 3: query user_profiles with all filters ──
  const t = await getTranslations('admin')
  const locale = await getLocale()

  if (authFilterIds !== null && authFilterIds.length === 0) {
    // No auth users match the filter — skip DB query entirely
    return (
      <div className="p-6 md:p-8">
        <PageHeader total={0} t={t} view={view} />
        <CustomersFilterBar search={search} tier={tier} emailStatus={emailStatus} />
        <p className="mt-12 text-center text-sm text-zinc-500">{t('customers.noResults')}</p>
      </div>
    )
  }

  let profileQuery = supabase
    .from('user_profiles')
    .select(
      'id, display_name, avatar_url, current_tier, total_orders, total_spent_cents, created_at',
      { count: 'exact' }
    )
    .order(sort, { ascending: sortDir === 'asc' })

  if (authFilterIds !== null) profileQuery = profileQuery.in('id', authFilterIds)
  if (search && !isEmailSearch) profileQuery = profileQuery.ilike('display_name', `%${search}%`)
  if (tier) profileQuery = profileQuery.eq('current_tier', tier)

  const { data: profiles, count: profileCount } = await profileQuery.range(
    (page - 1) * perPage,
    page * perPage - 1
  )

  const total = profileCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  // ── Phase 4: join auth data ──
  const customers = (profiles ?? []).map((p) => {
    const auth = authMap.get(p.id)
    return {
      id: p.id,
      email: auth?.email ?? '—',
      emailConfirmed: auth?.emailConfirmed ?? false,
      createdAt: auth?.createdAt ?? p.created_at,
      profile: p,
    }
  })

  // Build param string for sort link construction (preserves other filters)
  function sortLink(col: SortCol) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tier) params.set('tier', tier)
    if (emailStatus) params.set('emailStatus', emailStatus)
    if (view !== 'table') params.set('view', view)
    const newDir = sort === col && sortDir === 'desc' ? 'asc' : 'desc'
    params.set('sort', col)
    params.set('sortDir', newDir)
    return `?${params.toString()}`
  }

  function pageLink(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tier) params.set('tier', tier)
    if (emailStatus) params.set('emailStatus', emailStatus)
    if (sort !== 'created_at') params.set('sort', sort)
    if (sortDir !== 'desc') params.set('sortDir', sortDir)
    if (view !== 'table') params.set('view', view)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  const thClass = 'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400'

  return (
    <div className="p-6 md:p-8">
      <PageHeader total={total} t={t} view={view} />
      <CustomersFilterBar search={search} tier={tier} emailStatus={emailStatus} />

      {customers.length === 0 ? (
        <p className="mt-12 text-center text-sm text-zinc-500">
          {search || tier || emailStatus ? t('customers.noResults') : t('customers.noCustomers')}
        </p>
      ) : (
        <>
          {/* ── Grid view ── */}
          {view === 'grid' && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {customers.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/customers/${c.id}`}
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all duration-200 hover:border-amber-500/30 hover:bg-zinc-800/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                >
                  {/* Amber top accent */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* Avatar */}
                  <div className="mb-4 flex flex-col items-center gap-3">
                    <CustomerAvatar
                      avatarUrl={c.profile?.avatar_url ?? null}
                      name={c.profile?.display_name ?? c.email}
                      size={64}
                    />
                    <div className="w-full text-center">
                      <p className="truncate font-semibold text-zinc-50 transition-colors group-hover:text-amber-400">
                        {c.profile?.display_name ?? (
                          <span className="italic text-zinc-500">No name</span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                        {c.email}
                      </p>
                    </div>
                  </div>

                  {/* Tier + email status row */}
                  <div className="mb-3 flex items-center justify-between">
                    <TierBadge tier={c.profile?.current_tier ?? null} />
                    <span
                      className={`flex items-center gap-1 text-[10px] font-medium ${
                        c.emailConfirmed ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {c.emailConfirmed ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {c.emailConfirmed ? t('customers.verified') : t('customers.unverified')}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <ShoppingBag className="h-3 w-3 text-zinc-500" />
                      <span className="tabular-nums text-zinc-300 font-medium">
                        {c.profile?.total_orders ?? 0}
                      </span>
                      <span className="text-zinc-600">{t('customers.ordersCount')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Star className="h-3 w-3 text-amber-500/60" />
                      <span className="tabular-nums font-semibold text-zinc-200">
                        {formatPrice(c.profile?.total_spent_cents ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Join date */}
                  <p className="mt-3 text-center text-[10px] text-zinc-600">
                    {t('customers.joined')}{' '}
                    {new Date(c.createdAt).toLocaleDateString(locale, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* ── Desktop table ── */}
          {view === 'table' && (
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-zinc-800 md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/80">
                  <tr>
                    <th className={`${thClass} text-left`}>{t('customers.customer')}</th>
                    <th className={`${thClass} text-left`}>{t('customers.email')}</th>
                    <th className={`${thClass} text-left`}>{t('customers.tier')}</th>
                    <th className={`${thClass} text-right`}>
                      <Link
                        href={sortLink('total_orders')}
                        className="inline-flex items-center justify-end gap-1 hover:text-amber-400 transition-colors"
                      >
                        {t('customers.ordersCount')}
                        <SortIcon
                          col="total_orders"
                          active={sort === 'total_orders'}
                          dir={sortDir}
                        />
                      </Link>
                    </th>
                    <th className={`${thClass} text-right`}>
                      <Link
                        href={sortLink('total_spent_cents')}
                        className="inline-flex items-center justify-end gap-1 hover:text-amber-400 transition-colors"
                      >
                        {t('customers.spent')}
                        <SortIcon
                          col="total_spent_cents"
                          active={sort === 'total_spent_cents'}
                          dir={sortDir}
                        />
                      </Link>
                    </th>
                    <th className={`${thClass} text-left`}>{t('customers.emailStatus')}</th>
                    <th className={`${thClass} text-left`}>
                      <Link
                        href={sortLink('created_at')}
                        className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors"
                      >
                        {t('customers.joined')}
                        <SortIcon col="created_at" active={sort === 'created_at'} dir={sortDir} />
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {customers.map((c) => (
                    <tr key={c.id} className="group transition-colors hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                          <CustomerAvatar
                            avatarUrl={c.profile?.avatar_url ?? null}
                            name={c.profile?.display_name ?? c.email}
                            size={32}
                          />
                          <span className="font-medium text-zinc-50 transition-colors group-hover:text-amber-400">
                            {c.profile?.display_name ?? (
                              <span className="italic text-zinc-500">—</span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{c.email}</td>
                      <td className="px-4 py-3">
                        <TierBadge tier={c.profile?.current_tier ?? null} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                        {c.profile?.total_orders ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-100">
                        {formatPrice(c.profile?.total_spent_cents ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <EmailStatusBadge confirmed={c.emailConfirmed} t={t} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-xs text-zinc-500">
                        {new Date(c.createdAt).toLocaleDateString(locale, {
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
          )}

          {/* ── Mobile cards (table view only) ── */}
          {view === 'table' && (
            <div className="mt-4 space-y-3 md:hidden">
              {customers.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/customers/${c.id}`}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:bg-zinc-800/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar
                        avatarUrl={c.profile?.avatar_url ?? null}
                        name={c.profile?.display_name ?? c.email}
                        size={36}
                      />
                      <div>
                        <p className="font-medium text-zinc-50">{c.profile?.display_name ?? '—'}</p>
                        <p className="text-xs text-zinc-400">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <TierBadge tier={c.profile?.current_tier ?? null} />
                      <EmailStatusBadge confirmed={c.emailConfirmed} t={t} small />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
                    <span>{t('customers.orders', { count: c.profile?.total_orders ?? 0 })}</span>
                    <span className="font-medium text-zinc-200">
                      {formatPrice(c.profile?.total_spent_cents ?? 0)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                {t('customers.pageOf', { current: page, totalPages })}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageLink(page - 1)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    {t('customers.previous')}
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageLink(page + 1)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    {t('customers.next')}
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

// ── Sub-components ──────────────────────────────────────────

function PageHeader({
  total,
  t,
  view,
}: {
  total: number
  t: Awaited<ReturnType<typeof import('next-intl/server').getTranslations>>
  view: 'table' | 'grid'
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-zinc-400" />
        <h1 className="text-2xl font-bold text-zinc-50">{t('customers.title')}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">{t('customers.total', { count: total })}</span>
        <CustomersViewToggle view={view} />
      </div>
    </div>
  )
}

function CustomerAvatar({
  avatarUrl,
  name,
  size,
}: {
  avatarUrl: string | null
  name: string
  size: number
}) {
  const cls = `shrink-0 rounded-full object-cover`
  const fallbackCls = `flex shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 font-semibold`

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={cls}
        style={{ width: size, height: size }}
        unoptimized
      />
    )
  }
  const fontSize = size <= 32 ? 'text-xs' : 'text-sm'
  return (
    <div className={`${fallbackCls} ${fontSize}`} style={{ width: size, height: size }}>
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function EmailStatusBadge({
  confirmed,
  t,
  small,
}: {
  confirmed: boolean
  t: Awaited<ReturnType<typeof import('next-intl/server').getTranslations>>
  small?: boolean
}) {
  if (small) {
    return (
      <span
        className={`text-[10px] font-medium ${confirmed ? 'text-emerald-400' : 'text-red-400'}`}
      >
        {confirmed ? t('customers.verified') : t('customers.unverified')}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        confirmed
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-red-500/10 text-red-400 ring-red-500/20'
      }`}
    >
      <span className={`h-1 w-1 rounded-full ${confirmed ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {confirmed ? t('customers.verified') : t('customers.unverified')}
    </span>
  )
}
