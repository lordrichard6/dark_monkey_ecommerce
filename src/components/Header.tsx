import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'
import { DesktopTopBar } from '@/components/DesktopTopBar'

export async function Header() {
  let user: { email?: string | null; user_metadata?: { avatar_url?: string } } | null = null
  let displayName: string | null = null
  let avatarUrl: string | null = null
  let isAdmin = false

  try {
    const supabase = await createClient()
    const userData = await getUserSafe(supabase)

    if (userData) {
      user = userData
      const admin = getAdminClient()
      const client = admin ?? supabase
      const { data: profile } = await client
        .from('user_profiles')
        .select('display_name, avatar_url, is_admin')
        .eq('id', userData.id)
        .single()
      displayName = profile?.display_name ?? null
      avatarUrl = profile?.avatar_url ?? null
      isAdmin = profile?.is_admin ?? false
    }
  } catch (error) {
    console.error('Error fetching header data:', error)
  }

  const userInfo = user ? { user, displayName, avatarUrl, isAdmin } : { user: null, displayName: null, avatarUrl: null, isAdmin: false }

  return (
    <>
      <SideNav isAdmin={isAdmin} />
      <DesktopTopBar {...userInfo} />
      <MobileHeader {...userInfo} />
    </>
  )
}
