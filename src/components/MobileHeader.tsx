'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { signOut } from '@/actions/auth'

import { type Category } from '@/actions/admin-categories'

type NavCategory = Category & { subcategories: Category[] }

type Props = {
  user: { email?: string | null } | null
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
  categories: NavCategory[]
  boardCounts?: { tasks: number; ideas: number }
  supportCounts?: { open: number; inProgress: number }
  orderCounts?: { paid: number; processing: number; shipped: number }
  newUsersCount?: number
}

export function MobileHeader({
  user,
  displayName,
  avatarUrl,
  isAdmin,
  categories,
  boardCounts,
  supportCounts,
  orderCounts,
  newUsersCount = 0,
}: Props) {
  const totalBadge = isAdmin
    ? (boardCounts?.tasks ?? 0) +
      (boardCounts?.ideas ?? 0) +
      (supportCounts?.open ?? 0) +
      (supportCounts?.inProgress ?? 0) +
      (orderCounts?.paid ?? 0) +
      (orderCounts?.processing ?? 0) +
      (orderCounts?.shipped ?? 0) +
      newUsersCount
    : 0
  const t = useTranslations('common')
  const tUser = useTranslations('userMenu')
  const tAdmin = useTranslations('admin')
  const [open, setOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const pathname = usePathname()

  const anyOpen = open || adminOpen

  function closeMenu() {
    setOpen(false)
    setShowCategories(false)
    setOpenCategoryId(null)
  }

  function closeAdmin() {
    setAdminOpen(false)
  }

  function closeAll() {
    closeMenu()
    closeAdmin()
  }

  // Lock body scroll whenever any drawer is open
  useEffect(() => {
    document.body.style.overflow = anyOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [anyOpen])

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    if (path === '/account') return pathname === '/account'
    return pathname.startsWith(path)
  }

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
      isActive(path)
        ? 'bg-amber-500/20 text-amber-400'
        : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
    }`

  const adminLinkClass = (path: string) =>
    `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
      isActive(path)
        ? 'bg-amber-500/20 text-amber-400'
        : 'text-amber-500/60 hover:bg-white/10 hover:text-amber-400'
    }`

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl md:hidden">
        <nav className="flex h-14 items-center justify-between px-4">
          {/* Left side: burger + admin toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                closeAdmin()
                setOpen(true)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/10 hover:border-white/30"
              aria-label="Open menu"
            >
              <BurgerIcon className="h-5 w-5 text-zinc-50" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  setAdminOpen(true)
                }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                  adminOpen
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/50'
                }`}
                aria-label={`Open admin menu${totalBadge > 0 ? `, ${totalBadge} notifications` : ''}`}
              >
                <ShieldIcon className="h-4 w-4" />
                {totalBadge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white ring-1 ring-black">
                    {totalBadge > 99 ? '99+' : totalBadge}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Centre: logo */}
          <Link href="/" className="flex flex-1 justify-center" onClick={closeAll}>
            <DarkMonkeyLogo size="sm" noLink />
          </Link>

          {/* Right side: cart only */}
          <CartTrigger />
        </nav>
      </header>

      {/* ── Shared overlay ──────────────────────────────────────────────────── */}
      <div
        role="presentation"
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          anyOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeAll}
        aria-hidden={!anyOpen}
      />

      {/* ── Normal menu drawer ──────────────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-[70] flex h-full w-[min(320px,85vw)] flex-col border-l border-white/10 bg-zinc-950/98 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <button
            type="button"
            onClick={() => (showCategories ? setShowCategories(false) : closeMenu())}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
            aria-label={showCategories ? t('back') : 'Close menu'}
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
          <div className="w-10" />
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* Main view */}
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
              <Link href="/" onClick={closeMenu} className={navLinkClass('/')}>
                <HomeIcon className="h-5 w-5 shrink-0" />
                {t('shop')}
              </Link>

              <Link
                href="/account/wishlist"
                onClick={closeMenu}
                className={navLinkClass('/account/wishlist')}
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
                <span className="flex-1 text-left">{t('categories')}</span>
                <ChevronIcon className="h-4 w-4 shrink-0" />
              </button>
            </nav>
          </div>

          {/* Categories panel */}
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
                  {t('back')}
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
                            <div className="space-y-1 bg-black/20 px-2 py-1 ml-2 sm:ml-4 rounded-lg">
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

        {/* User section */}
        <div className="shrink-0 border-t border-white/10 p-4">
          {user ? (
            <>
              <div className="mb-2 px-4 py-2">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <UserIcon className="h-4 w-4 text-zinc-400" />
                    </span>
                  )}
                  <div className="flex flex-col items-start leading-none min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-50">
                      {displayName ?? user.email?.split('@')[0] ?? tUser('account')}
                    </p>
                  </div>
                </div>
                {user.email && (
                  <p className="mt-1 truncate text-xs text-zinc-500 pl-11">{user.email}</p>
                )}
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

      {/* ── Admin menu drawer ───────────────────────────────────────────────── */}
      {isAdmin && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
          aria-hidden={!adminOpen}
          className={`fixed top-0 right-0 z-[70] flex h-full w-[min(300px,85vw)] flex-col border-l border-amber-500/20 bg-zinc-950/98 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out md:hidden ${
            adminOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Admin drawer header */}
          <div className="flex h-14 items-center justify-between border-b border-amber-500/20 px-4">
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
                {t('adminManagement')}
              </span>
            </div>
            <button
              type="button"
              onClick={closeAdmin}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
              aria-label="Close admin menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Admin links */}
          <nav
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Link
              href="/admin/dashboard"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/dashboard')}
            >
              <LayoutDashboardIcon className="h-5 w-5 shrink-0" />
              {tAdmin('nav.dashboard')}
            </Link>
            <Link
              href="/admin/products"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/products')}
            >
              <BoxIcon className="h-5 w-5 shrink-0" />
              {tAdmin('nav.products')}
            </Link>
            <Link
              href="/admin/orders"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/orders')}
            >
              <PackageIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{tAdmin('nav.orders')}</span>
              {((orderCounts?.paid ?? 0) > 0 ||
                (orderCounts?.processing ?? 0) > 0 ||
                (orderCounts?.shipped ?? 0) > 0) && (
                <div className="flex items-center gap-1">
                  {(orderCounts?.paid ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold leading-none text-white">
                      {(orderCounts?.paid ?? 0) > 9 ? '9+' : orderCounts!.paid}
                    </span>
                  )}
                  {(orderCounts?.processing ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-none text-black">
                      {(orderCounts?.processing ?? 0) > 9 ? '9+' : orderCounts!.processing}
                    </span>
                  )}
                  {(orderCounts?.shipped ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-500 px-1 text-[9px] font-bold leading-none text-white">
                      {(orderCounts?.shipped ?? 0) > 9 ? '9+' : orderCounts!.shipped}
                    </span>
                  )}
                </div>
              )}
            </Link>
            <Link
              href="/admin/support"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/support')}
            >
              <LifeBuoyIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{tAdmin('nav.support')}</span>
              {((supportCounts?.open ?? 0) > 0 || (supportCounts?.inProgress ?? 0) > 0) && (
                <div className="flex items-center gap-1">
                  {(supportCounts?.open ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-none text-black">
                      {(supportCounts?.open ?? 0) > 9 ? '9+' : supportCounts!.open}
                    </span>
                  )}
                  {(supportCounts?.inProgress ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold leading-none text-white">
                      {(supportCounts?.inProgress ?? 0) > 9 ? '9+' : supportCounts!.inProgress}
                    </span>
                  )}
                </div>
              )}
            </Link>
            <Link
              href="/admin/board"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/board')}
            >
              <KanbanIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{tAdmin('nav.board')}</span>
              {((boardCounts?.tasks ?? 0) > 0 || (boardCounts?.ideas ?? 0) > 0) && (
                <div className="flex items-center gap-1">
                  {(boardCounts?.tasks ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                      {(boardCounts?.tasks ?? 0) > 9 ? '9+' : boardCounts!.tasks}
                    </span>
                  )}
                  {(boardCounts?.ideas ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-bold leading-none text-white">
                      {(boardCounts?.ideas ?? 0) > 9 ? '9+' : boardCounts!.ideas}
                    </span>
                  )}
                </div>
              )}
            </Link>
            <Link
              href="/admin/customers"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/customers')}
            >
              <UsersIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{tAdmin('nav.customers')}</span>
              {newUsersCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold leading-none text-white">
                  {newUsersCount > 9 ? '9+' : newUsersCount}
                </span>
              )}
            </Link>
            {/* Gallery — disabled, not launched yet */}
            <span className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium opacity-35 text-amber-500/60">
              <ImageIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{tAdmin('nav.gallery')}</span>
              <span className="rounded px-1 py-0.5 text-[8px] font-medium uppercase tracking-wider text-zinc-600 ring-1 ring-zinc-700/50">
                Soon
              </span>
            </span>
            <Link
              href="/admin/activity"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/activity')}
            >
              <ActivityIcon className="h-5 w-5 shrink-0" />
              {tAdmin('nav.activity')}
            </Link>
            <Link
              href="/admin/accounting"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/accounting')}
            >
              <ReceiptIcon className="h-5 w-5 shrink-0" />
              {tAdmin('nav.accounting')}
            </Link>
            <Link
              href="/admin/settings"
              onClick={closeAdmin}
              className={adminLinkClass('/admin/settings')}
            >
              <SettingsIcon className="h-5 w-5 shrink-0" />
              {tAdmin('nav.settings')}
            </Link>
          </nav>

          {/* View store link */}
          <div className="shrink-0 border-t border-amber-500/10 p-4">
            <Link
              href="/"
              onClick={closeAdmin}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-zinc-600 transition hover:bg-white/5 hover:text-zinc-400"
            >
              <HomeIcon className="h-4 w-4 shrink-0" />
              {tAdmin('nav.viewStore')}
            </Link>
          </div>
        </aside>
      )}
    </>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
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
      <path d="m3 11 19-9-9 19-2-8-8-2z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ActivityIcon({ className }: { className?: string }) {
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
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function ReceiptIcon({ className }: { className?: string }) {
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
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  )
}

function LifeBuoyIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  )
}

function KanbanIcon({ className }: { className?: string }) {
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
      <rect width="5" height="14" x="2" y="5" rx="1" />
      <rect width="5" height="9" x="9.5" y="5" rx="1" />
      <rect width="5" height="11" x="17" y="5" rx="1" />
    </svg>
  )
}
