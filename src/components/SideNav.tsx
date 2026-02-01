'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'

type Category = { id: string; name: string; slug: string }

type Props = {
  categories: Category[]
  isAdmin?: boolean
}

const SIDEBAR_COLLAPSED = 64
const SIDEBAR_EXPANDED = 240

export function SideNav({ categories, isAdmin }: Props) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const commonItems = [
    { href: '/', label: 'Shop', icon: HomeIcon },
    { href: '/account/wishlist', label: 'Wishlist', icon: HeartIcon },
  ]

  const adminItems = isAdmin
    ? [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
        { href: '/admin/products', label: 'Products', icon: BoxIcon },
        { href: '/admin/orders', label: 'Orders', icon: PackageIcon },
        { href: '/admin/discounts', label: 'Discounts', icon: TagIcon },
      ]
    : []

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-hidden border-r border-white/10 bg-black/60 backdrop-blur-xl transition-[width] duration-200 ease-out md:flex"
      style={{ width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false)
        setCategoriesOpen(false)
      }}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
        <DarkMonkeyLogo size="sm" href="/" showText={expanded} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {commonItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-white/10 text-zinc-50'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-50'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </Link>
          )
        })}

        {/* Categories with submenu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
              pathname.startsWith('/categories')
                ? 'bg-white/10 text-zinc-50'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <GridIcon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate">Categories</span>}
            </span>
            {expanded && categories.length > 0 && (
              <ChevronIcon
                className={`h-4 w-4 shrink-0 transition ${categoriesOpen ? 'rotate-90' : ''}`}
              />
            )}
          </button>
          {expanded && categoriesOpen && categories.length > 0 && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
              <Link
                href="/categories"
                className={`block rounded px-2 py-1.5 text-xs transition ${
                  pathname === '/categories'
                    ? 'text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All categories
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className={`block rounded px-2 py-1.5 text-xs transition ${
                    pathname === `/categories/${cat.slug}`
                      ? 'text-amber-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {adminItems.length > 0 && (
          <>
            <div className="my-2 border-t border-white/10" role="separator" />
            {expanded && (
              <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Admin
              </p>
            )}
            {adminItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-white/10 text-zinc-50'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-50'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {expanded && <span className="truncate">{label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function LayoutDashboardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M12 11v4" />
      <path d="M10 15h4" />
    </svg>
  )
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}
