import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  let sessionUser = null
  try {
    const { data } = await supabase.auth.getUser()
    sessionUser = data.user
  } catch {
    //
  }

  if (!sessionUser) redirect('/login')

  return <>{children}</>
}
