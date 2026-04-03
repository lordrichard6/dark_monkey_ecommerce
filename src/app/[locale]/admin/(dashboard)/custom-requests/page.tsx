import { getAdminCustomRequests, getCustomRequestStatusCounts } from '@/actions/custom-products'
import { getAdminUser } from '@/lib/auth-admin'
import { redirect } from 'next/navigation'
import { CustomRequestsTable } from './CustomRequestsTable'

const STATUS_TABS = ['pending', 'in_review', 'ready', 'rejected', 'all'] as const

/** "in_review" → "In Review", "tote_bag" → "Tote Bag" */
function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function AdminCustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const user = await getAdminUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const status = params.status ?? 'pending'

  const [requests, counts] = await Promise.all([
    getAdminCustomRequests(status === 'all' ? undefined : status),
    getCustomRequestStatusCounts(),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Custom Product Requests</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review user custom product requests, mark them ready, and link the created product.
        </p>
      </div>

      {/* Status filter tabs with count badges (#10) */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => {
          const count = counts[s] ?? 0
          const isActive = status === s
          return (
            <a
              key={s}
              href={`?status=${s}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                  : 'border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              {formatLabel(s)}
              {count > 0 && (
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${
                    isActive ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </a>
          )
        })}
      </div>

      <CustomRequestsTable requests={requests} />
    </div>
  )
}
