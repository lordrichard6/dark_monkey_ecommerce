import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function AdminFooter() {
  const t = useTranslations('admin')

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
        { href: '/admin/settings', label: t('nav.settings') },
        { href: '/', label: t('nav.viewStore') },
      ],
    },
  ]

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
          <p className="text-[11px] text-zinc-700">{t('footer.adminPanel')}</p>
          <p className="text-[11px] text-zinc-700">
            {t('footer.allRightsReserved', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  )
}
