import { getLocale } from 'next-intl/server'
import { getAnnouncements } from '@/actions/announcements'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { GradientBackground } from '@/components/GradientBackground'
import { Header } from '@/components/Header'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CookieConsent } from '@/components/CookieConsent'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const announcements = await getAnnouncements(locale)

  return (
    <>
      <GradientBackground />
      <AnnouncementBar announcements={announcements} />
      <Header />
      <main className="relative flex min-h-screen flex-col pt-14 md:pl-16">{children}</main>
      <CartDrawer />
      <CookieConsent />
      <InstallPrompt />
    </>
  )
}
