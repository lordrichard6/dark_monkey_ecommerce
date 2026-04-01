import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`
  return n.toString()
}

export async function AdminFooter() {
  const t = await getTranslations('admin')

  const adminLinks = [
    {
      label: t('nav.content'),
      links: [
        { href: '/admin/dashboard', label: t('nav.dashboard') },
        { href: '/admin/products', label: t('nav.products') },
        { href: '/admin/categories', label: t('nav.categories') },
        { href: '/admin/gallery', label: t('nav.gallery') },
      ],
    },
    {
      label: t('nav.commerce'),
      links: [
        { href: '/admin/orders', label: t('nav.orders') },
        { href: '/admin/customers', label: t('nav.customers') },
        { href: '/admin/discounts', label: t('nav.discounts') },
        { href: '/admin/stock-notifications', label: t('nav.stockAlerts') },
        { href: '/admin/accounting', label: t('nav.accounting') },
      ],
    },
    {
      label: t('nav.engagement'),
      links: [
        { href: '/admin/reviews', label: t('nav.reviews') },
        { href: '/admin/newsletter', label: t('nav.newsletter') },
        { href: '/admin/messages', label: t('nav.announcements') },
        { href: '/admin/features', label: t('nav.features') },
      ],
    },
    {
      label: t('nav.system'),
      links: [
        { href: '/admin/board', label: t('nav.board') },
        { href: '/admin/support', label: 'Support' },
        { href: '/admin/settings', label: t('nav.settings') },
        { href: '/', label: t('nav.viewStore') },
      ],
    },
  ]

  // Fetch store stats
  let userCount = 0
  let orderCount = 0
  let productCount = 0
  try {
    const admin = getAdminClient()
    const client = admin ?? (await createClient())
    const [usersRes, ordersRes, productsRes] = await Promise.all([
      client.from('user_profiles').select('id', { count: 'exact', head: true }),
      client.from('orders').select('id', { count: 'exact', head: true }),
      client.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])
    userCount = usersRes.count ?? 0
    orderCount = ordersRes.count ?? 0
    productCount = productsRes.count ?? 0
  } catch {
    // non-critical
  }

  const stats = [
    {
      value: formatCount(userCount),
      label: 'Users',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      ring: 'ring-violet-500/20',
    },
    {
      value: formatCount(orderCount),
      label: 'Orders',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        </svg>
      ),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
    },
    {
      value: formatCount(productCount),
      label: 'Products',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </svg>
      ),
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      ring: 'ring-cyan-500/20',
    },
  ]

  return (
    <footer className="relative mt-8 overflow-hidden">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative bg-zinc-950/90 backdrop-blur-sm">
        {/* Main link grid */}
        <div className="mx-auto max-w-7xl px-8 pb-6 pt-8 md:pl-8">
          {/* Floating stats — absolute top-right of this container */}
          <div className="mb-6 flex items-center justify-end gap-2 sm:absolute sm:right-8 sm:top-6 sm:mb-0">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ring-1 ${stat.bg} ${stat.ring}`}
              >
                <span className={stat.color}>{stat.icon}</span>
                <span className={`text-sm font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] font-medium text-zinc-500">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {adminLinks.map((group) => (
              <div key={group.label}>
                {/* Section heading */}
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-amber-500/50" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                    {group.label}
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-1.5 text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
                      >
                        <span className="h-px w-2 bg-zinc-700 transition-all duration-150 group-hover:w-3 group-hover:bg-amber-500/60" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-8 py-3 md:pl-8">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 ring-1 ring-amber-500/20">
                <span className="text-[7px] font-black tracking-tighter text-amber-400">DM</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                DarkMonkey
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-[10px] font-medium text-zinc-600">
                {t('footer.adminPanel')}
              </span>
            </div>

            {/* Status + copyright */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] text-zinc-600">Operational</span>
              </div>
              <span className="text-[10px] text-zinc-700">
                {t('footer.allRightsReserved', { year: new Date().getFullYear() })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
