'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { signOut } from '@/actions/auth'

type Category = { id: string; name: string; slug: string }

type Props = {
  categories: Category[]
  user: { email?: string | null } | null
  displayName: string | null
  isAdmin: boolean
}

export function MobileHeader({ categories, user, displayName, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const pathname = usePathname()

  function closeMenu() {
    setOpen(false)
    setCategoriesOpen(false)
  }

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={closeMenu}
                className="rounded-lg border border-amber-500/40 px-2.5 py-2 text-sm font-medium text-amber-400 transition hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300"
                aria-label="Admin"
              >
                Admin
              </Link>
            )}
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
          <DarkMonkeyLogo size="sm" href="/" onClick={closeMenu} />
          <button
            type="button"
            onClick={closeMenu}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <Link
            href="/"
            onClick={closeMenu}
            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
              pathname === '/'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
            }`}
          >
            <HomeIcon className="h-5 w-5 shrink-0" />
            Shop
          </Link>

          <Link
            href="/account/wishlist"
            onClick={closeMenu}
            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
              pathname === '/account/wishlist'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
            }`}
          >
            <HeartIcon className="h-5 w-5 shrink-0" />
            Wishlist
          </Link>

          {/* Categories accordion */}
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium transition ${
                pathname.startsWith('/categories')
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <GridIcon className="h-5 w-5 shrink-0" />
                Categories
              </span>
              <ChevronIcon
                className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                  categoriesOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                categoriesOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-white/5 bg-black/30 py-2">
                  <Link
                    href="/categories"
                    onClick={closeMenu}
                    className={`block px-6 py-2.5 text-sm transition ${
                      pathname === '/categories'
                        ? 'text-amber-400'
                        : 'text-zinc-400 hover:text-zinc-50'
                    }`}
                  >
                    All categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      onClick={closeMenu}
                      className={`block px-6 py-2.5 text-sm transition ${
                        pathname === `/categories/${cat.slug}`
                          ? 'text-amber-400'
                          : 'text-zinc-400 hover:text-zinc-50'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          {user ? (
            <>
              <div className="mb-2 px-4 py-2">
                <p className="truncate text-sm font-medium text-zinc-50">
                  {displayName ?? user.email?.split('@')[0] ?? 'Account'}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                )}
              </div>
              <Link
                href="/account"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
              >
                <UserIcon className="h-5 w-5 shrink-0" />
                Account
              </Link>
              <Link
                href="/account/orders"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
              >
                <OrdersIcon className="h-5 w-5 shrink-0" />
                Orders
              </Link>
              <form action={signOut} className="mt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm text-zinc-500 transition hover:bg-white/10 hover:text-red-400"
                >
                  <LogOutIcon className="h-5 w-5 shrink-0" />
                  Sign out
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
              Sign in/up
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
