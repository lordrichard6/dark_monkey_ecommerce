import Link from 'next/link'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { UserMenuDropdown } from '@/components/UserMenuDropdown'

type UserInfo = {
  user: { email?: string | null; user_metadata?: { avatar_url?: string } } | null
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
}

export function DesktopTopBar({ user, displayName, avatarUrl, isAdmin }: UserInfo) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <header className="fixed top-0 left-0 right-0 z-30 hidden h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl md:flex md:pl-16">
      <div className="flex flex-1 items-center justify-between px-4">
        <DarkMonkeyLogo size="sm" textOnly />
        <div className="flex items-center gap-2">
          {isDev && (
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-amber-500/40 px-3 py-2 text-sm font-medium text-amber-400 transition hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300"
              title="Admin (dev only)"
            >
              Admin
            </Link>
          )}
          <CartTrigger />
          <UserMenuDropdown
            user={user}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  )
}
