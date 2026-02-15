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
import { Footer } from '@/components/Footer'
import { CurrencyProvider } from '@/components/currency/CurrencyContext'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { Toaster } from 'sonner'

import { BackToTop } from '@/components/BackToTop'
import { SupportWidget } from '@/components/SupportWidget'
import { CompareBar } from '@/components/product/CompareBar'

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
  if (!routing.locales.includes(locale as any)) notFound()
  setRequestLocale(locale)

  const [messages, cart, announcements] = await Promise.all([
    getMessages(),
    getCart(),
    getAnnouncements()
  ])

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DARKMONKEY',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    sameAs: [
      'https://instagram.com/darkmonkey',
      'https://facebook.com/darkmonkey'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+41-XX-XXX-XXXX',
      contactType: 'customer service',
      areaServed: 'CH',
      availableLanguage: ['English', 'Portuguese', 'German']
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <CurrencyProvider>
        <CartProvider initialCart={cart}>
          <GradientBackground />
          <AnnouncementBar announcements={announcements} />
          <Header />
          <main className="relative flex min-h-screen flex-col pt-14 md:pl-16">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <CookieConsent />
          <InstallPrompt />
          <BackToTop />
          <SupportWidget />
          <CompareBar />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  )
}
