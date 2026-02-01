import { createClient } from '@/lib/supabase/server'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'
import { DesktopTopBar } from '@/components/DesktopTopBar'

export async function Header() {
  let categories: { id: string; name: string; slug: string }[] | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true })
    categories = data
  } catch {
    categories = []
  }

  return (
    <>
      <SideNav categories={categories ?? []} />
      <DesktopTopBar />
      <MobileHeader categories={categories ?? []} />
    </>
  )
}
