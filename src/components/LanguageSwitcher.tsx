'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Français',
}

function GlobeIcon({ className }: { className?: string }) {
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
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

type Props = {
  variant?: 'desktop' | 'mobile'
}

export function LanguageSwitcher({ variant = 'desktop' }: Props) {
  const locale = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  function switchLocale(newLocale: string) {
    setOpen(false)
    const path = pathname === '/' ? '' : pathname
    window.location.href = `/${newLocale}${path}`
  }

  const isMobile = variant === 'mobile'

  if (isMobile) {
    return (
      <div className="border-t border-white/10 px-4 py-3">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Language
        </p>
        <div className="flex flex-wrap gap-2">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchLocale(loc)}
              className={`min-w-[3rem] rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${loc === locale
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-50'
                }`}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-zinc-50"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Choose language"
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="max-w-[80px] truncate">{LOCALE_NAMES[locale] ?? locale}</span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 py-1 shadow-xl backdrop-blur-xl"
          role="menu"
        >
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchLocale(loc)}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition ${loc === locale
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-50'
                }`}
              role="menuitem"
            >
              {LOCALE_NAMES[loc] ?? loc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
