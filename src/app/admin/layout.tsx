import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth-admin'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'

export default async function AdminLayout({
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
  if (!user) redirect('/login?redirectTo=/admin')

  const adminUser = await getAdminUser()
  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-50">Access denied</h1>
          <p className="mt-2 text-zinc-400">You don&apos;t have admin access.</p>
          <Link href="/" className="mt-4 inline-block text-amber-400 hover:text-amber-300">
            ← Back to store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-56 border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4">
          <DarkMonkeyLogo size="sm" href="/" showText={false} />
          <span className="ml-2 text-xs text-zinc-500">Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            href="/admin"
            className="block rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
          >
            Products
          </Link>
          <Link
            href="/admin/orders"
            className="block rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
          >
            Orders
          </Link>
          <Link
            href="/admin/discounts"
            className="block rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
          >
            Discounts
          </Link>
          <Link
            href="/"
            className="mt-8 block rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Back to store
          </Link>
        </nav>
      </aside>
      <main className="pl-56 min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  )
}
