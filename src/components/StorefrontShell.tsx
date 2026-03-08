'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { BackToTop } from '@/components/BackToTop'
import { SupportWidget } from '@/components/SupportWidget'
import { CompareBar } from '@/components/product/CompareBar'
import { useIsMounted } from '@/hooks/useIsMounted'

export function StorefrontShell() {
  const pathname = usePathname()
  const mounted = useIsMounted()

  // Don't render anything until client-side hydration — prevents any server-side flash
  if (!mounted) return null
  if (pathname.includes('/admin')) return null

  return (
    <>
      <Footer />
      <BackToTop />
      <SupportWidget />
      <CompareBar />
    </>
  )
}
