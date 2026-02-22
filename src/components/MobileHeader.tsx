'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { signOut } from '@/actions/auth'
import { Search } from 'lucide-react'

import { type Category } from '@/actions/admin-categories'

type NavCategory = Category & { subcategories: Category[] }

type Props = {
  user: { email?: string | null } | null
  displayName: string | null
  isAdmin: boolean
  categories: NavCategory[]
}

export function MobileHeader({ user, displayName, isAdmin, categories }: Props) {
  const t = useTranslations('common')
  const tUser = useTranslations('userMenu')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const pathname = usePathname()

  function closeMenu() {
    setOpen(false)
    setShowCategories(false)
    setOpenCategoryId(null)
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  // Reset categories view when menu closes
  useEffect(() => {
    if (!open && showCategories) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCategories(false)
    }
  }, [open, showCategories])

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    // Precise matching for sub-sections to avoid multiple highlights
    if (path === '/account') return pathname === '/account'
    return pathname.startsWith(path)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl md:hidden">
        <nav className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/10 hover:border-white/30"
            aria-label="Open menu"
          >
            <BurgerIcon className="h-5 w-5 text-zinc-50" />
          </button>
          <Link href="/" className="flex flex-1 justify-center" onClick={closeMenu}>
            <DarkMonkeyLogo size="sm" noLink />
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => router.push('/search')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/10 hover:border-white/30"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-zinc-50" />
            </button>
            <CartTrigger />
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        role="presentation"
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMenu}
        aria-hidden={!open}
      />

      {/* Slide-out menu */}
      <aside
        className={`fixed top-0 right-0 z-[70] flex h-full w-[min(320px,85vw)] flex-col border-l border-white/10 bg-zinc-950/98 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <button
            type="button"
            onClick={() => (showCategories ? setShowCategories(false) : closeMenu())}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
          >
            {showCategories ? (
              <ChevronIcon className="h-5 w-5 rotate-180" />
            ) : (
              <CloseIcon className="h-5 w-5" />
            )}
          </button>
          <div className="flex-1 flex justify-center">
            <DarkMonkeyLogo size="sm" href="/" onClick={closeMenu} />
          </div>
          <div className="w-10" /> {/* Spacer to center logo */}
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* Main Focused View */}
          <div
            className={`absolute inset-0 flex flex-col transition-all duration-300 ease-in-out ${
              showCategories
                ? '-translate-y-full opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <nav
              className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <Link
                href="/"
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive('/')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                <HomeIcon className="h-5 w-5 shrink-0" />
                {t('shop')}
              </Link>

              <Link
                href="/art"
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive('/art')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                <ImageIcon className="h-5 w-5 shrink-0" />
                Art
              </Link>

              <Link
                href="/account/wishlist"
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive('/account/wishlist')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                <HeartIcon className="h-5 w-5 shrink-0" />
                {t('wishlist')}
              </Link>

              <button
                type="button"
                onClick={() => setShowCategories(true)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  showCategories
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                <GridIcon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Browse Categories</span>
                <ChevronIcon className="h-4 w-4 shrink-0" />
              </button>

              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                  <p className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Admin Management
                  </p>
                  <Link
                    href="/admin/dashboard"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/dashboard')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <LayoutDashboardIcon className="h-5 w-5 shrink-0" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/products"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/products')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <BoxIcon className="h-5 w-5 shrink-0" />
                    Products
                  </Link>
                  <Link
                    href="/admin/orders"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/orders')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <PackageIcon className="h-5 w-5 shrink-0" />
                    Orders
                  </Link>
                  <Link
                    href="/admin/discounts"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/discounts')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <TagIcon className="h-5 w-5 shrink-0" />
                    Discounts
                  </Link>
                  <Link
                    href="/admin/gallery"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/gallery')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <ImageIcon className="h-5 w-5 shrink-0" />
                    Gallery
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/settings')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <SettingsIcon className="h-5 w-5 shrink-0" />
                    Settings
                  </Link>
                  <Link
                    href="/admin/features"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive('/admin/features')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
                    }`}
                  >
                    <SparklesIcon className="h-5 w-5 shrink-0" />
                    Features
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* Categories Expanded View */}
          <div
            className={`absolute inset-0 flex flex-col transition-all duration-300 ease-in-out ${
              showCategories
                ? 'translate-y-0 opacity-100'
                : 'translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-zinc-50 uppercase tracking-widest">
                  {t('categories')}
                </h3>
                <button
                  onClick={() => setShowCategories(false)}
                  className="text-[10px] font-bold text-amber-400 uppercase"
                >
                  Back
                </button>
              </div>
              <Link
                href="/categories"
                onClick={closeMenu}
                className={`block rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive('/categories')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                {t('allCategories')}
              </Link>
              <div className="mt-2 space-y-1">
                {categories.map((cat) => {
                  const isCatOpen = openCategoryId === cat.id
                  return (
                    <div key={cat.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setOpenCategoryId(isCatOpen ? null : cat.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition ${
                          isActive(`/categories/${cat.slug}`)
                            ? 'text-amber-400 bg-white/5'
                            : 'text-zinc-400 hover:text-zinc-50 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-sm font-medium">{cat.name}</span>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <ChevronIcon
                            className={`h-4 w-4 shrink-0 transition-transform ${isCatOpen ? 'rotate-90' : ''}`}
                          />
                        )}
                      </button>
                      <div
                        className={`grid transition-all duration-200 ease-in-out ${
                          isCatOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          {cat.subcategories && (
                            <div className="space-y-1 bg-black/20 px-2 py-1 ml-4 rounded-lg">
                              {cat.subcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/categories/${sub.slug}`}
                                  onClick={closeMenu}
                                  className={`block rounded-lg px-6 py-2 text-xs transition ${
                                    isActive(`/categories/${sub.slug}`)
                                      ? 'text-amber-500 font-bold'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>

        <LanguageSwitcher variant="mobile" />

        <div className="shrink-0 border-t border-white/10 p-4">
          {user ? (
            <>
              <div className="mb-2 px-4 py-2">
                <div className="flex flex-col items-start leading-none">
                  <p className="truncate text-sm font-medium text-zinc-50">
                    {displayName ?? user.email?.split('@')[0] ?? tUser('account')}
                  </p>
                  {isAdmin && (
                    <span className="mt-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 ring-1 ring-inset ring-amber-500/20">
                      Admin
                    </span>
                  )}
                </div>
                {user.email && <p className="truncate text-xs text-zinc-500">{user.email}</p>}
              </div>
              <Link
                href="/account"
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive('/account')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                <UserIcon className="h-5 w-5 shrink-0" />
                {tUser('account')}
              </Link>
              <Link
                href="/account/orders"
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive('/account/orders')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-50'
                }`}
              >
                <OrdersIcon className="h-5 w-5 shrink-0" />
                {tUser('orders')}
              </Link>
              <form action={signOut} className="mt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm text-zinc-500 transition hover:bg-white/10 hover:text-red-400"
                >
                  <LogOutIcon className="h-5 w-5 shrink-0" />
                  {tUser('signOut')}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
            >
              <UserIcon className="h-5 w-5 shrink-0" />
              {tUser('signInUp')}
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

function BurgerIcon({ className }: { className?: string }) {
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
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
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

function ImageIcon({ className }: { className?: string }) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
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

function UserIcon({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function OrdersIcon({ className }: { className?: string }) {
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
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function LogOutIcon({ className }: { className?: string }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

function LayoutDashboardIcon({ className }: { className?: string }) {
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
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
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
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
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
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M12 11v4" />
      <path d="M10 15h4" />
    </svg>
  )
}

function TagIcon({ className }: { className?: string }) {
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
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
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

function SparklesIcon({ className }: { className?: string }) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
