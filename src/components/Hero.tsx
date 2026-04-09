'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { HeroLogo } from './HeroLogo'
import { ArrowRight } from 'lucide-react'
import { LaunchCountdownBanner } from './LaunchCountdownBanner'

// Custom spring cubic-bezier — physical, snappy, premium
const SPRING = [0.32, 0.72, 0, 1] as const

/**
 * Animates a word/phrase inline with blur-fade-up.
 * Each instance is independently timed via `delay`.
 * Respects prefers-reduced-motion via useReducedMotion().
 */
function AnimatedWord({
  children,
  delay,
  className,
  style,
}: {
  children: React.ReactNode
  delay: number
  className?: string
  style?: React.CSSProperties
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.span
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.75, delay, ease: SPRING }}
      className={className}
      style={{ display: 'inline-block', ...style }}
    >
      {children}
    </motion.span>
  )
}

export function Hero() {
  const t = useTranslations('home')
  const heroRef = useRef<HTMLElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Scroll-linked parallax — tracked against this section only
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  // Scroll transforms — disabled when reduced-motion is preferred
  const videoScaleRaw = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const videoOpacityRaw = useTransform(scrollYProgress, [0, 0.75], [0.75, 0])
  const contentYRaw = useTransform(scrollYProgress, [0, 1], [0, 90])

  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ minHeight: 'calc(100dvh - 3.5rem - var(--ann-bar-h, 0rem))' }}
    >
      {/* ── Video background with scroll-linked scale + fade ── */}
      <motion.video
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        style={
          shouldReduceMotion
            ? { opacity: 0.75 }
            : { scale: videoScaleRaw, opacity: videoOpacityRaw }
        }
        src="/videos/dm_hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* ── Gradient vignette — brand-tinted (zinc-950), not pure black ── */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/15" />

      {/* ── Film grain overlay — fixed, pointer-events-none, GPU-safe ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
        aria-hidden
      />

      {/* ── Content with subtle upward parallax ── */}
      <motion.div
        className="relative z-10 mx-auto max-w-4xl text-center"
        style={shouldReduceMotion ? undefined : { y: contentYRaw }}
      >
        {/* Badge / countdown */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0, ease: SPRING }
          }
          className="mb-3 mt-2 flex justify-center sm:mb-6 sm:mt-6"
        >
          <LaunchCountdownBanner position="inline" />
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.85, delay: 0.15, ease: SPRING }
          }
          className="mb-1 md:mb-5"
        >
          <HeroLogo />
        </motion.div>

        {/* ── Headline — fluid type, tight tracking, word-level stagger ── */}
        <h1 className="font-bold text-zinc-50 [font-size:clamp(2.5rem,8vw,5.5rem)] tracking-[-0.03em] leading-tight">
          <AnimatedWord delay={0.3}>{t('heroLine1')}</AnimatedWord>{' '}
          <AnimatedWord
            delay={0.4}
            className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          >
            {t('heroGold')}
          </AnimatedWord>{' '}
          <AnimatedWord
            delay={0.5}
            style={{
              fontFamily: 'var(--font-pacifico), cursive',
              color: '#ff2d55',
              textShadow: '0 0 12px rgba(255,45,85,0.6), 0 0 30px rgba(255,45,85,0.25)',
            }}
          >
            {t('heroPink')}
          </AnimatedWord>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.62, ease: SPRING }
          }
          className="mt-2 text-sm text-zinc-400 sm:mt-5 sm:text-lg md:text-xl"
        >
          {t('heroSubtitle')}
        </motion.p>

        {/* ── CTAs — rounded-full pills with button-in-button arrow ── */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.76, ease: SPRING }
          }
          className="mt-4 flex flex-col items-center justify-center gap-2 sm:mt-10 sm:flex-row sm:gap-4"
        >
          {/* Primary — amber gradient pill */}
          <button
            type="button"
            onClick={scrollToProducts}
            aria-label={t('shopPremiumCollection')}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 py-2 pl-7 pr-2 text-zinc-950 shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)] active:scale-[0.97] sm:w-auto"
          >
            {/* Hover gloss */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative pr-4 text-base font-black uppercase tracking-tight sm:text-lg">
              {t('shopPremiumCollection')}
            </span>
            {/* Button-in-button arrow */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>

          {/* Secondary — ghost pill */}
          <Link
            href="/categories"
            aria-label={t('exploreByCategory')}
            className="group flex w-full items-center justify-between rounded-full border border-white/20 bg-black/20 py-2 pl-7 pr-2 text-zinc-200 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/40 hover:bg-white/10 active:scale-[0.97] sm:w-auto"
          >
            <span className="pr-4 text-sm font-medium sm:text-base">{t('exploreByCategory')}</span>
            {/* Button-in-button arrow */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator — premium travel-line ── */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 1.5, ease: SPRING }
        }
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        aria-hidden
      >
        {/* Label */}
        <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-zinc-500 select-none">
          Scroll
        </span>

        {/* Line + traveling dot */}
        <div className="relative h-12 w-px overflow-hidden">
          {/* Static line */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-600/60 to-transparent" />
          {/* Traveling glow dot */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 h-3 w-px rounded-full"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(251,191,36,0) 0%, rgba(251,191,36,0.9) 50%, rgba(251,191,36,0) 100%)',
                boxShadow: '0 0 6px 1px rgba(251,191,36,0.5)',
              }}
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.3 }}
            />
          )}
        </div>
      </motion.div>
    </section>
  )
}
