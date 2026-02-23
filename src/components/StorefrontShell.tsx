'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { BackToTop } from '@/components/BackToTop'
import { SupportWidget } from '@/components/SupportWidget'
import { CompareBar } from '@/components/product/CompareBar'

export function StorefrontShell() {
  const pathname = usePathname()
  const isAdmin = pathname.includes('/admin')
  if (isAdmin) return null

  return (
    <>
      <Footer />
      <BackToTop />
      <SupportWidget />
      <CompareBar />
    </>
  )
}
