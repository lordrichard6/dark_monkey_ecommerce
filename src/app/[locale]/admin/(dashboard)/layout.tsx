import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth-admin'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    //
  }
  if (!user) redirect('/admin/login')

  const adminUser = await getAdminUser()
  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md animate-admin-card-in">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="h-1 bg-gradient-to-r from-red-900/80 via-amber-600/50 to-amber-500/60" />
            <div className="relative px-8 py-12 text-center">
              <div className="relative mx-auto mb-6 inline-flex">
                <div className="absolute inset-0 -m-4 rounded-full bg-red-500/20 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10 text-red-400/90"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-zinc-50">Access denied</h1>
              <p className="mt-3 text-zinc-400">
                You don&apos;t have admin access. Contact your administrator to request access.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:from-amber-400 hover:to-amber-500"
              >
                ← Back to store
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
