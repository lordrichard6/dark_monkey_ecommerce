import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getCart } from '@/lib/cart'
import { getAnnouncements } from '@/actions/announcements'
import { CartProvider } from '@/components/cart/CartProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { GradientBackground } from '@/components/GradientBackground'
import { Header } from '@/components/Header'
import { CookieConsent } from '@/components/CookieConsent'
import { CurrencyProvider } from '@/components/currency/CurrencyContext'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import dynamic from 'next/dynamic'
import { Toaster } from 'sonner'
import NextTopLoader from 'nextjs-toploader'

// ssr: false so it never renders on the server — no flash of footer on admin pages
const StorefrontShell = dynamic(
  () => import('@/components/StorefrontShell').then((m) => m.StorefrontShell),
  { ssr: false }
)

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  // Fix: Check if locale exists in routing.locales directly since hasLocale might not be available
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound()
  setRequestLocale(locale)

  const [messages, cart, announcements] = await Promise.all([
    getMessages(),
    getCart(),
    getAnnouncements(locale),
  ])

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DARKMONKEY',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.webp`,
    sameAs: ['https://instagram.com/darkmonkey', 'https://facebook.com/darkmonkey'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      areaServed: 'CH',
      availableLanguage: ['English', 'Portuguese', 'German'],
    },
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <CurrencyProvider>
        <CartProvider initialCart={cart}>
          <NextTopLoader
            color="#f59e0b"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #f59e0b,0 0 5px #f59e0b"
            zIndex={99999}
          />
          <GradientBackground />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:rounded-lg focus:bg-green-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
          >
            Skip to main content
          </a>
          <AnnouncementBar announcements={announcements} />
          <Header />
          <main id="main-content" className="relative flex min-h-screen flex-col pt-14 md:pl-16">
            {children}
          </main>
          <StorefrontShell />
          <CartDrawer />
          <CookieConsent />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  )
}
