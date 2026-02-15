import { getAnnouncements } from '@/actions/announcements'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { GradientBackground } from '@/components/GradientBackground'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CookieConsent } from '@/components/CookieConsent'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { BackToTop } from '@/components/BackToTop'
import { SupportWidget } from '@/components/SupportWidget'
import { CompareBar } from '@/components/product/CompareBar'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const announcements = await getAnnouncements()

  return (
    <>
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
    </>
  )
}
