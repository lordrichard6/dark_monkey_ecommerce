import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getCategories, type Category } from '@/actions/admin-categories'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'
import { DesktopTopBar } from '@/components/DesktopTopBar'

type NavCategory = Category & { subcategories: Category[] }

export async function Header() {
  let user: { email?: string | null; user_metadata?: { avatar_url?: string } } | null = null
  let displayName: string | null = null
  let avatarUrl: string | null = null
  let isAdmin = false
  let navCategories: NavCategory[] = []

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

  try {
    const allCats = await getCategories()
    navCategories = allCats
      .filter((c) => !c.parent_id)
      .map((c) => ({ ...c, subcategories: allCats.filter((sc) => sc.parent_id === c.id) }))
  } catch (error) {
    console.error('Error fetching categories:', error)
  }

  const userInfo = user
    ? { user, displayName, avatarUrl, isAdmin }
    : { user: null, displayName: null, avatarUrl: null, isAdmin: false }

  return (
    <>
      <SideNav isAdmin={isAdmin} categories={navCategories} />
      <DesktopTopBar {...userInfo} />
      <MobileHeader {...userInfo} categories={navCategories} />
    </>
  )
}
