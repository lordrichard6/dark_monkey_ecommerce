import Link from 'next/link'

const adminLinks = [
  {
    label: 'Content',
    links: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/gallery', label: 'Gallery' },
    ],
  },
  {
    label: 'Commerce',
    links: [
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/discounts', label: 'Discounts' },
      { href: '/admin/stock-notifications', label: 'Stock Alerts' },
    ],
  },
  {
    label: 'Engagement',
    links: [
      { href: '/admin/reviews', label: 'Reviews' },
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/messages', label: 'Announcements' },
      { href: '/admin/features', label: 'Features' },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/admin/settings', label: 'Settings' },
      { href: '/', label: 'View Store ↗' },
    ],
  },
]

export function AdminFooter() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-black/20 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {adminLinks.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                {group.label}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-zinc-500 transition hover:text-zinc-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-white/5 pt-6 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-zinc-700">DARKMONKEY Admin Panel</p>
          <p className="text-[11px] text-zinc-700">
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
