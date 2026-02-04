'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '@/lib/currency'

const COUNTRY_REGION_OPTIONS = [
  { value: 'CH', label: 'Switzerland', currency: 'CHF' },
  { value: 'DE', label: 'Germany', currency: 'EUR' },
  { value: 'AT', label: 'Austria', currency: 'EUR' },
  { value: 'FR', label: 'France', currency: 'EUR' },
  { value: 'IT', label: 'Italy', currency: 'EUR' },
  { value: 'ES', label: 'Spain', currency: 'EUR' },
  { value: 'GB', label: 'United Kingdom', currency: 'GBP' },
  { value: 'NL', label: 'Netherlands', currency: 'EUR' },
  { value: 'BE', label: 'Belgium', currency: 'EUR' },
  { value: 'PT', label: 'Portugal', currency: 'EUR' },
  { value: 'US', label: 'United States', currency: 'USD' },
  { value: 'CA', label: 'Canada', currency: 'CHF' }, // Fallback to CHF or implement CAD later
] as const

const FOOTER_LINKS = [
  { href: '/refund', key: 'refundPolicy' },
  { href: '/privacy', key: 'privacyPolicy' },
  { href: '/terms', key: 'termsOfService' },
  { href: '/shipping', key: 'shippingPolicy' },
  { href: '/faq', key: 'faq' },
  { href: '/legal', key: 'legalNotice' },
  { href: '/contact', key: 'contactInfo' },
] as const

const COUNTRY_COOKIE = 'darkmonkey-country-region'

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

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Currency
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-[100px] items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-left text-sm text-zinc-100 transition hover:border-white/20"
        >
          <span>{currency}</span>
          <ChevronIcon
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <ul className="absolute bottom-full left-0 z-10 mb-1 max-h-60 w-full overflow-auto rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
            {SUPPORTED_CURRENCIES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency(c)
                    setOpen(false)
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition ${currency === c
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-50'
                    }`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function Footer() {
  const t = useTranslations('footer')
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryValue, setCountryValue] = useState<(typeof COUNTRY_REGION_OPTIONS)[number]['value']>(COUNTRY_REGION_OPTIONS[0].value)
  const countryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = document.cookie
      .split('; ')
      .find((r) => r.startsWith(`${COUNTRY_COOKIE}=`))
    const value = saved?.split('=')[1]
    if (value && COUNTRY_REGION_OPTIONS.some((o) => o.value === value)) {
      setCountryValue(value as (typeof COUNTRY_REGION_OPTIONS)[number]['value'])
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    if (countryOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [countryOpen])

  const { setCurrency } = useCurrency()

  function selectCountry(value: (typeof COUNTRY_REGION_OPTIONS)[number]['value']) {
    setCountryValue(value)
    setCountryOpen(false)
    document.cookie = `${COUNTRY_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 365}`

    // Auto-switch currency
    const opt = COUNTRY_REGION_OPTIONS.find(o => o.value === value)
    if (opt && SUPPORTED_CURRENCIES.includes(opt.currency as any)) {
      setCurrency(opt.currency as SupportedCurrency)
    }
  }

  const currentCountry = COUNTRY_REGION_OPTIONS.find((o) => o.value === countryValue)

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-zinc-950/95 backdrop-blur-sm">
      {/* Top: logo + selectors + payment icons */}
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          {/* Logo (center on mobile, left on desktop) */}
          <Link href="/" className="shrink-0">
            <DarkMonkeyLogo size="lg" className="text-zinc-50" noLink />
          </Link>

          {/* Country/region + Language (left block on desktop) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col gap-2" ref={countryRef}>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Country / region
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCountryOpen(!countryOpen)}
                  className="flex min-w-[200px] items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-left text-sm text-zinc-100 transition hover:border-white/20"
                  aria-expanded={countryOpen}
                  aria-haspopup="listbox"
                >
                  <span className="truncate">{currentCountry?.label ?? 'Switzerland'}</span>
                  <ChevronIcon
                    className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${countryOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {countryOpen && (
                  <ul
                    className="absolute bottom-full left-0 z-10 mb-1 max-h-60 min-w-[200px] overflow-auto rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl"
                    role="listbox"
                  >
                    {COUNTRY_REGION_OPTIONS.map((opt) => (
                      <li key={opt.value} role="option" aria-selected={countryValue === opt.value}>
                        <button
                          type="button"
                          onClick={() => selectCountry(opt.value)}
                          className={`block w-full px-4 py-2.5 text-left text-sm transition ${countryValue === opt.value
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-50'
                            }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <CurrencySelector />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Language
              </span>
              <div className="min-w-[200px]">
                <LanguageSwitcher variant="desktop" />
              </div>
            </div>
          </div>

          {/* Payment icons (right on desktop) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              We accept
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {['Visa', 'Mastercard', 'PayPal', 'Klarna', 'Amex'].map((name) => (
                <div
                  key={name}
                  className="flex h-9 min-w-[52px] items-center justify-center rounded border border-white/10 bg-white/5 px-2 text-[10px] font-medium uppercase text-zinc-400"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: copyright + policy links (horizontal, bullet-separated) */}
      <div className="border-t border-white/5 px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-1 sm:gap-y-0">
          <span>© {new Date().getFullYear()}, DarkMonkey</span>
          {FOOTER_LINKS.map((link) => (
            <span key={link.href} className="flex items-center gap-3 sm:gap-1">
              <span className="hidden text-zinc-600 sm:inline" aria-hidden>
                •
              </span>
              <Link
                href={link.href as '/'}
                className="text-zinc-500 transition hover:text-amber-400"
              >
                {t(link.key)}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
