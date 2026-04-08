'use client'

import { motion } from 'motion/react'

/**
 * Wraps children with a scroll-triggered entry animation.
 * Uses GPU-safe transform + opacity + blur — no layout-triggering properties.
 * Custom spring cubic-bezier: [0.32, 0.72, 0, 1] (snappy, physical feel).
 * Plays once as element enters the viewport.
 */
type Props = {
  children: React.ReactNode
  delay?: number
  className?: string
  /** Vertical offset at rest before reveal. Default 40. */
  y?: number
}

export function ScrollReveal({ children, delay = 0, className, y = 40 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.32, 0.72, 0, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
