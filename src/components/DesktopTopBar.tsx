'use client'

import { useState, useEffect } from 'react'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { UserMenuDropdown } from '@/components/UserMenuDropdown'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationBell } from '@/components/admin/NotificationBell'

type UserInfo = {
  user: { email?: string | null; user_metadata?: { avatar_url?: string } } | null
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
}

export function DesktopTopBar({ user, displayName, avatarUrl, isAdmin }: UserInfo) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed left-0 right-0 z-30 hidden h-14 border-b border-white/10 backdrop-blur-xl transition-[top,background-color] duration-300 md:flex md:pl-16 ${
        scrolled ? 'bg-zinc-950/70' : 'bg-zinc-950/40'
      }`}
      style={{ top: 'var(--ann-bar-h, 0rem)' }}
    >
      <div className="flex flex-1 items-center justify-between px-4">
        {/* Left side – Logo */}
        <div className="flex h-full items-center gap-4">
          <DarkMonkeyLogo size="sm" href="/" textOnly />
        </div>

        {/* Right side – Search and utilities */}
        <div className="flex items-center gap-4">
          <div className="w-80">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="desktop" showName={false} />
            {isAdmin && <NotificationBell />}
            <CartTrigger />
            <UserMenuDropdown
              user={user}
              displayName={displayName}
              avatarUrl={avatarUrl}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
