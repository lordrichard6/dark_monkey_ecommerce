'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered reveal — opacity + translate + blur fade-in.
 *
 * **Implementation note:** previously used `motion/react`'s `whileInView`,
 * which mounts a full motion island per instance (~10-12 of these on the
 * homepage). Same effect, lower cost: one IntersectionObserver + CSS
 * transition. Hydration is cheaper and we don't pull motion/react in
 * through this code path.
 *
 * API identical to the old motion-based version:
 *   - `delay` (seconds) — staggers a sibling list
 *   - `y` (px) — starting offset before reveal (default 40)
 *   - Plays once on first intersection
 *   - Auto-respects `prefers-reduced-motion` via global override in
 *     globals.css plus a JS-level early-out (we skip the observer entirely
 *     and reveal immediately, saving the IO setup cost too).
 */
type Props = {
  children: React.ReactNode
  delay?: number
  className?: string
  /** Vertical offset at rest before reveal. Default 40. */
  y?: number
}

const SPRING_EASE = 'cubic-bezier(0.32,0.72,0,1)'

export function ScrollReveal({ children, delay = 0, className, y = 40 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Hidden on first paint. Flips to visible once IO fires (or immediately
  // under prefers-reduced-motion).
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reduced-motion: skip the observer, reveal immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-80px 0px -80px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
        filter: visible ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 900ms ${SPRING_EASE} ${delay}s, transform 900ms ${SPRING_EASE} ${delay}s, filter 900ms ${SPRING_EASE} ${delay}s`,
        willChange: visible ? 'auto' : 'transform, opacity, filter',
      }}
    >
      {children}
    </div>
  )
}
