'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { UserMenuDropdown } from '@/components/UserMenuDropdown'
import { CurrencySelector } from '@/components/currency/CurrencySelector'
import { SearchBar } from '@/components/search/SearchBar'

type UserInfo = {
  user: { email?: string | null; user_metadata?: { avatar_url?: string } } | null
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
}

export function DesktopTopBar({ user, displayName, avatarUrl, isAdmin }: UserInfo) {
  const t = useTranslations('common')
  return (
    <header className="fixed top-0 left-0 right-0 z-30 hidden h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl md:flex md:pl-16">
      <div className="flex flex-1 items-center gap-4 px-4">
        <DarkMonkeyLogo size="sm" textOnly />
        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>
        <div className="flex items-center gap-2">
          <CurrencySelector />
          <LanguageSwitcher variant="desktop" />
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
