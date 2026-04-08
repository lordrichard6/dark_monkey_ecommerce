'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { HeroLogo } from './HeroLogo'
import { ArrowRight, ChevronDown } from 'lucide-react'
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
  const locale = useLocale()
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
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4"
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
        preload="auto"
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
          className="mb-8 mt-8 flex justify-center"
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
          className="mb-3 md:mb-5"
        >
          <HeroLogo />
        </motion.div>

        {/* ── Headline — fluid type, tight tracking, word-level stagger ── */}
        <h1 className="font-bold tracking-tight text-zinc-50 [font-size:clamp(1.75rem,5.5vw,4.5rem)] tracking-[-0.025em]">
          {locale === 'pt' ? (
            <>
              <AnimatedWord delay={0.3}>{t('quality')}</AnimatedWord>{' '}
              <AnimatedWord
                delay={0.4}
                className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              >
                {t('premium')}
              </AnimatedWord>{' '}
              <AnimatedWord delay={0.5}>{t('craftedFor')}</AnimatedWord>{' '}
            </>
          ) : (
            <>
              <AnimatedWord
                delay={0.3}
                className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              >
                {t('premium')}
              </AnimatedWord>{' '}
              <AnimatedWord delay={0.4}>{t('qualityCraftedFor')}</AnimatedWord>{' '}
            </>
          )}
          <AnimatedWord
            delay={0.5}
            style={{
              fontFamily: 'var(--font-pacifico), cursive',
              color: '#ff2d55',
              textShadow: '0 0 5px #ff2d55, 0 0 10px #ff2d55, 0 0 20px #ff2d55, 0 0 40px #ff2d55',
            }}
          >
            {t('you')}
          </AnimatedWord>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.62, ease: SPRING }
          }
          className="mt-4 text-sm text-zinc-400 sm:mt-6 sm:text-lg md:text-xl"
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
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4"
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

        {/* ── Social proof micro-stats ── */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.92, ease: SPRING }
          }
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500 sm:gap-5"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">★</span>
            <span>{t('heroStatReviews')}</span>
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:block" aria-hidden />
          <span>{t('heroStatShipping')}</span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:block" aria-hidden />
          <span>{t('heroStatCheckout')}</span>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator — pulsing chevron ── */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 1.3, ease: SPRING }
        }
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5 text-zinc-500" />
        </motion.div>
      </motion.div>
    </section>
  )
}
