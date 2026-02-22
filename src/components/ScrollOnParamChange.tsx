'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Scrolls to the top of the page whenever URL search params change.
 * Skips the initial mount so it doesn't interfere with page load scroll position.
 * Wrap in <Suspense> when used, as required by Next.js for useSearchParams().
 */
export function ScrollOnParamChange() {
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [searchParams])

  return null
}
