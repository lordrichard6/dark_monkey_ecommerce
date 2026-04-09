import { unstable_cache } from 'next/cache'
import { createClient, getUserSafe } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { type Category } from '@/actions/admin-categories'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'
import { DesktopTopBar } from '@/components/DesktopTopBar'

type NavCategory = Category & { subcategories: Category[] }

// Categories change rarely — cache for 5 minutes across all requests.
// Uses admin client (service-role key) so cookies() is never called inside cache.
const getCachedCategories = unstable_cache(
  async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    const supabase = getAdminClient()
    if (!supabase) return [] as Category[]
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order, image_url, is_featured, subtitle')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) return [] as Category[]
    return (data ?? []).map((c) => ({ ...c, product_count: 0 })) as Category[]
  },
  ['header-nav-categories'],
  { revalidate: 300 }
)

/**
 * Badge counts are cached for 60 seconds across all requests.
 * The admin client uses the service-role key (env var) so it's safe inside
 * an unstable_cache function — no per-request state needed.
 */
const getCachedAdminBadgeCounts = unstable_cache(
  async () => {
    const client = getAdminClient()
    if (!client) return null

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

    const [
      taskRes,
      ideaRes,
      openTicketsRes,
      inProgressTicketsRes,
      newUsersRes,
      paidOrdersRes,
      processingOrdersRes,
      shippedOrdersRes,
      pendingCustomRequestsRes,
    ] = await Promise.all([
      client
        .from('admin_board_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'task')
        .in('status', ['open', 'in_progress']),
      client
        .from('admin_board_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'idea')
        .neq('status', 'archived'),
      client
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      client
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_progress'),
      client
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twoDaysAgo),
      client
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'paid')
        .eq('is_archived', false),
      client
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing')
        .eq('is_archived', false),
      client
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'shipped')
        .eq('is_archived', false),
      client
        .from('custom_product_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

    return {
      boardCounts: { tasks: taskRes.count ?? 0, ideas: ideaRes.count ?? 0 },
      supportCounts: {
        open: openTicketsRes.count ?? 0,
        inProgress: inProgressTicketsRes.count ?? 0,
      },
      orderCounts: {
        paid: paidOrdersRes.count ?? 0,
        processing: processingOrdersRes.count ?? 0,
        shipped: shippedOrdersRes.count ?? 0,
      },
      newUsersCount: newUsersRes.count ?? 0,
      customRequestsCount: pendingCustomRequestsRes.count ?? 0,
    }
  },
  ['admin-nav-badge-counts'],
  { revalidate: 60 } // refresh at most once per minute
)

export async function Header() {
  let user: { email?: string | null; user_metadata?: { avatar_url?: string } } | null = null
  let displayName: string | null = null
  let avatarUrl: string | null = null
  let isAdmin = false
  let navCategories: NavCategory[] = []

  // Single getAdminClient() call — reused for profile + badge queries
  const adminClient = getAdminClient()

  try {
    const supabase = await createClient()
    const userData = await getUserSafe(supabase)

    if (userData) {
      user = userData
      const client = adminClient ?? supabase
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
    const allCats = await getCachedCategories()
    navCategories = allCats
      .filter((c) => !c.parent_id)
      .map((c) => ({ ...c, subcategories: allCats.filter((sc) => sc.parent_id === c.id) }))
  } catch (error) {
    console.error('Error fetching categories:', error)
  }

  let boardCounts: { tasks: number; ideas: number } | undefined
  let supportCounts: { open: number; inProgress: number } | undefined
  let orderCounts: { paid: number; processing: number; shipped: number } | undefined
  let newUsersCount = 0
  let customRequestsCount = 0

  if (isAdmin) {
    try {
      const cached = await getCachedAdminBadgeCounts()
      if (cached) {
        boardCounts = cached.boardCounts
        supportCounts = cached.supportCounts
        orderCounts = cached.orderCounts
        newUsersCount = cached.newUsersCount
        customRequestsCount = cached.customRequestsCount
      }
    } catch {
      // non-critical — badges just won't show
    }
  }

  const userInfo = user
    ? { user, displayName, avatarUrl, isAdmin }
    : { user: null, displayName: null, avatarUrl: null, isAdmin: false }

  return (
    <>
      <SideNav
        isAdmin={isAdmin}
        categories={navCategories}
        boardCounts={boardCounts}
        supportCounts={supportCounts}
        orderCounts={orderCounts}
        newUsersCount={newUsersCount}
        customRequestsCount={customRequestsCount}
      />
      <DesktopTopBar {...userInfo} />
      <MobileHeader
        {...userInfo}
        categories={navCategories}
        boardCounts={boardCounts}
        supportCounts={supportCounts}
        orderCounts={orderCounts}
        newUsersCount={newUsersCount}
        customRequestsCount={customRequestsCount}
      />
    </>
  )
}
