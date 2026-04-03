import { getAdminCustomRequests } from '@/actions/custom-products'
import { getAdminUser } from '@/lib/auth-admin'
import { redirect } from 'next/navigation'
import { CustomRequestsTable } from './CustomRequestsTable'

export default async function AdminCustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const user = await getAdminUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const status = params.status ?? 'pending'
  const requests = await getAdminCustomRequests(status === 'all' ? undefined : status)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Custom Product Requests</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review user custom product requests, mark them ready, and link the created product.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['pending', 'in_review', 'ready', 'rejected', 'all'].map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition ${
              status === s
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                : 'border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <CustomRequestsTable requests={requests} />
    </div>
  )
}
