import { createClient } from '@/lib/supabase/server'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'
import { DesktopTopBar } from '@/components/DesktopTopBar'

export async function Header() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true })

  return (
    <>
      <SideNav categories={categories ?? []} />
      <DesktopTopBar />
      <MobileHeader categories={categories ?? []} />
    </>
  )
}
