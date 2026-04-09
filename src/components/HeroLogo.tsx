'use client'

import Image from 'next/image'
import { motion } from 'motion/react'

export function HeroLogo() {
  return (
    <div className="relative mb-3 inline-flex items-center justify-center sm:mb-8">
      {/* ── Wide ambient glow ── */}
      <div
        className="absolute rounded-full bg-amber-500/10 blur-3xl"
        style={{ inset: '-40px' }}
        aria-hidden
      />

      {/* ── Tight inner glow ── */}
      <div
        className="absolute rounded-full bg-amber-400/20 blur-xl"
        style={{ inset: '-8px' }}
        aria-hidden
      />

      {/* ── Outer pulse ring ── */}
      <motion.div
        className="absolute rounded-full border border-amber-500/25"
        style={{ inset: '-20px' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
        aria-hidden
      />

      {/* ── Inner pulse ring (offset) ── */}
      <motion.div
        className="absolute rounded-full border border-amber-400/15"
        style={{ inset: '-20px' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 1.4 }}
        aria-hidden
      />

      {/* ── Rotating conic gradient ring ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '-3px',
          padding: '2px',
          background:
            'conic-gradient(from 0deg, rgba(251,191,36,0.9) 0%, rgba(251,191,36,0.2) 25%, rgba(251,191,36,0) 45%, rgba(251,191,36,0.2) 75%, rgba(251,191,36,0.9) 100%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      >
        <div className="h-full w-full rounded-full bg-zinc-950" />
      </motion.div>

      {/* ── Logo with float + breathe ── */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -12, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image
          src="/logo.webp"
          alt="DarkMonkey"
          width={220}
          height={220}
          className="relative z-10 mx-auto h-36 w-36 rounded-full object-contain drop-shadow-[0_8px_40px_rgba(251,191,36,0.35)] sm:h-48 sm:w-48 md:h-[220px] md:w-[220px]"
          priority
          unoptimized
        />
      </motion.div>
    </div>
  )
}
