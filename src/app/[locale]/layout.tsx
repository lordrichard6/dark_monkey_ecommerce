import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getCart } from '@/lib/cart'
import { CartProvider } from '@/components/cart/CartProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { GradientBackground } from '@/components/GradientBackground'
import { Header } from '@/components/Header'
import { CookieConsent } from '@/components/CookieConsent'
import { Footer } from '@/components/Footer'
import { CurrencyProvider } from '@/components/currency/CurrencyContext'
import { Toaster } from 'sonner'

export function generateStaticParams() {
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

  const [messages, cart] = await Promise.all([getMessages(), getCart()])

  return (
    <NextIntlClientProvider messages={messages}>
      <CurrencyProvider>
        <CartProvider initialCart={cart}>
          <GradientBackground />
          <Header />
          <main className="relative flex min-h-screen flex-col pt-14 md:pl-16">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <CookieConsent />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  )
}
