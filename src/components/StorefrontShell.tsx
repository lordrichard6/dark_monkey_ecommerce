'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Footer } from '@/components/Footer'
import { BackToTop } from '@/components/BackToTop'
import { SupportWidget } from '@/components/SupportWidget'
import { CompareBar } from '@/components/product/CompareBar'

export function StorefrontShell() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
