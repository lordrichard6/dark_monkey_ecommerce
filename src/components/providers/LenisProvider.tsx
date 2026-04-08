'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Wraps the app with Lenis smooth scroll.
 * Initialised once on mount, cleaned up on unmount.
 * Uses manual RAF loop for full control.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo out
      touchMultiplier: 2,
      infinite: false,
    })

    let animId: number

    function raf(time: number) {
      lenis.raf(time)
      animId = requestAnimationFrame(raf)
    }

    animId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(animId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
