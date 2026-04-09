'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '@/lib/currency'
import Image from 'next/image'
import { Instagram, Facebook, Send, Loader2, Mail, Clock } from 'lucide-react'
import { subscribeToNewsletter } from '@/actions/newsletter'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

const COUNTRY_FLAGS: Record<string, string> = {
  CH: '🇨🇭',
  DE: '🇩🇪',
  AT: '🇦🇹',
  FR: '🇫🇷',
  IT: '🇮🇹',
  ES: '🇪🇸',
  GB: '🇬🇧',
  NL: '🇳🇱',
  BE: '🇧🇪',
  PT: '🇵🇹',
  US: '🇺🇸',
  CA: '🇨🇦',
}

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
  { href: '/blog', key: 'blog' },
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CurrencySelector() {
  const t = useTranslations('footer')
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
        {t('currency')}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[13px] text-zinc-100 transition-[border-color,background-color] duration-200 hover:border-white/20 hover:bg-white/[0.05]"
        >
          <span>{currency}</span>
          <ChevronIcon
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <ul className="absolute bottom-full left-0 z-10 mb-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-2xl">
            {SUPPORTED_CURRENCIES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency(c)
                    setOpen(false)
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                    currency === c
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
  const [countryValue, setCountryValue] = useState<
    (typeof COUNTRY_REGION_OPTIONS)[number]['value']
  >(COUNTRY_REGION_OPTIONS[0].value)
  const countryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = document.cookie.split('; ').find((r) => r.startsWith(`${COUNTRY_COOKIE}=`))
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCountryOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const { setCurrency } = useCurrency()

  function selectCountry(value: (typeof COUNTRY_REGION_OPTIONS)[number]['value']) {
    setCountryValue(value)
    setCountryOpen(false)
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${COUNTRY_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 365}`

    // Auto-switch currency
    const opt = COUNTRY_REGION_OPTIONS.find((o) => o.value === value)
    if (opt && SUPPORTED_CURRENCIES.includes(opt.currency as SupportedCurrency)) {
      setCurrency(opt.currency as SupportedCurrency)
    }
  }

  const currentCountry = COUNTRY_REGION_OPTIONS.find((o) => o.value === countryValue)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await subscribeToNewsletter(formData)
    setSubmitting(false)
    if (result.success) {
      setIsSubscribed(true)
    }
  }

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-zinc-950/95 backdrop-blur-sm">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-20">
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
            <div className="max-w-md text-center lg:text-left">
              <ScrollReveal>
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-amber-400">
                  {t('newsletterEyebrow')}
                </span>
              </ScrollReveal>
              <ScrollReveal delay={0.06}>
                <h2 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                  {t('newsletterTitle')}
                </h2>
                <p className="mt-4 text-zinc-400">{t('newsletterDescription')}</p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.12} className="w-full max-w-md">
              {isSubscribed ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
                  <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-500">
                    <Send className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <span className="font-medium">{t('newsletterSuccess')}</span>
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex flex-col gap-3 sm:relative sm:flex-row sm:gap-0 sm:group"
                >
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder={t('newsletterPlaceholder')}
                    className="w-full rounded-full border border-white/10 bg-zinc-900 px-6 py-4 text-sm text-white placeholder-zinc-500 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 sm:group-hover:border-white/20"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center rounded-full bg-amber-500 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-zinc-950 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 sm:absolute sm:right-2 sm:top-2 sm:bottom-2 sm:w-auto sm:px-6 sm:py-0 sm:text-sm sm:tracking-normal"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      t('newsletterButton')
                    )}
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Top: logo + selectors + payment icons */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          {/* Logo & Info */}
          <ScrollReveal>
            <div className="flex flex-col gap-6">
              {/* Logo */}
              <Link href="/" className="shrink-0 self-start">
                <DarkMonkeyLogo size="lg" className="text-zinc-50" noLink />
              </Link>

              {/* Customer Service */}
              <div className="flex flex-col gap-3 pt-5 border-t border-white/5">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                  {t('customerService')}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                    <Clock className="h-4 w-4 text-amber-500/60 shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] text-zinc-300">{t('operatingHours')}</span>
                  </div>
                  <a
                    href="mailto:support@dark-monkey.ch"
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-500/5 group"
                  >
                    <Mail
                      className="h-4 w-4 text-amber-500/60 shrink-0 group-hover:text-amber-400"
                      strokeWidth={1.5}
                    />
                    <span className="text-[13px] text-zinc-300 group-hover:text-amber-400 transition-colors duration-200">
                      support@dark-monkey.ch
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Configuration block */}
          <ScrollReveal delay={0.08} className="flex flex-col gap-8 lg:col-span-2">
            <div className="flex flex-col gap-4">
              {/* Language — full width, first */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                  {t('language')}
                </span>
                <LanguageSwitcher variant="desktop" />
              </div>

              {/* Country + Currency — side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Country / Region */}
                <div className="flex flex-col gap-2" ref={countryRef}>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                    {t('countryRegion')}
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryOpen(!countryOpen)}
                      aria-expanded={countryOpen}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-zinc-100 transition-[border-color,background-color] duration-200 hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{COUNTRY_FLAGS[countryValue] || '🌐'}</span>
                        <span className="truncate text-[13px]">
                          {currentCountry?.label ?? 'Switzerland'}
                        </span>
                      </span>
                      <ChevronIcon
                        className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${countryOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {countryOpen && (
                      <ul
                        className="absolute bottom-full left-0 z-10 mb-1 w-full overflow-auto rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-2xl max-h-60"
                        role="listbox"
                      >
                        {COUNTRY_REGION_OPTIONS.map((opt) => (
                          <li
                            key={opt.value}
                            role="option"
                            aria-selected={countryValue === opt.value}
                          >
                            <button
                              type="button"
                              onClick={() => selectCountry(opt.value)}
                              className={`block w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                                countryValue === opt.value
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-50'
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className="text-lg">{COUNTRY_FLAGS[opt.value] || '🌐'}</span>
                                <span>{opt.label}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Currency */}
                <CurrencySelector />
              </div>
            </div>

            {/* Payment icons */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                {t('weAccept')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { name: 'Visa', src: '/payments/visa.png', width: 40, height: 25 },
                  { name: 'Mastercard', src: '/payments/mastercard.png', width: 40, height: 25 },
                  { name: 'PayPal', src: '/payments/paypal.png', width: 40, height: 25 },
                  { name: 'Klarna', src: '/payments/klarna.png', width: 42, height: 25 },
                  { name: 'Twint', src: '/payments/twint.png', width: 40, height: 25 },
                ].map(({ name, src, width, height }) => (
                  <div
                    key={name}
                    className="flex h-8 w-[50px] items-center justify-center rounded-lg bg-white px-1 py-1 transition-opacity duration-200 hover:opacity-80"
                    aria-label={name}
                  >
                    <Image
                      src={src}
                      alt={name}
                      width={width}
                      height={height}
                      style={{ height: '100%', width: 'auto' }}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                {t('followUs')}
              </span>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/dark_monkey_store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition-all duration-200 hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.5} />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61574367719121"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Bottom: copyright + policy links */}
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
                className="rounded text-zinc-500 transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
              >
                {t(link.key)}
              </Link>
            </span>
          ))}
        </div>
      </div>

      {/* Made by Lopes2Tech */}
      <div className="border-t border-white/[0.04] px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-center">
          <a
            href="https://www.lopes2tech.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-700 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-zinc-500">
              Crafted by
            </span>
            <span className="h-px w-6 bg-zinc-800 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:w-3 group-hover:bg-zinc-600" />
            <Image
              src="/images/lopes2tech_logo.png"
              alt="Lopes2Tech"
              width={18}
              height={18}
              className="rounded grayscale opacity-30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-70 group-hover:grayscale-0"
            />
            <span className="text-[11px] font-bold tracking-widest text-zinc-700 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-zinc-300">
              LOPES
              <span className="text-amber-500/60 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-amber-400">
                2
              </span>
              TECH
            </span>
          </a>
        </div>
      </div>
    </footer>
  )
}
