import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth-admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
