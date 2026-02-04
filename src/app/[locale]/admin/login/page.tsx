import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminUser } from '@/lib/auth-admin'
import { AdminLoginForm } from './admin-login-form'

export default async function AdminLoginPage() {
  const adminUser = await getAdminUser()
  if (adminUser) redirect('/admin/dashboard')

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <AdminLoginForm />
      <Link
        href="/"
        className="mt-8 text-sm text-zinc-500 transition hover:text-amber-400/90"
      >
        ← Back to store
      </Link>
    </div>
  )
}
