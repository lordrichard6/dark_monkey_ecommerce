'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight, Package, Truck, RotateCcw, Sparkles } from 'lucide-react'
import { LaunchCountdownBanner } from './LaunchCountdownBanner'
import { HeroLookbookTile } from './HeroLookbookTile'
import type { HomeProduct } from '@/actions/products'

const SPRING = [0.32, 0.72, 0, 1] as const

// Inline word animator — blur-fade-up per phrase, independently timed.
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
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.7, delay, ease: SPRING }}
      className={className}
      style={{ display: 'inline-block', ...style }}
    >
      {children}
    </motion.span>
  )
}

type HeroProductInput = Pick<
  HomeProduct,
  | 'slug'
  | 'name'
  | 'priceCents'
  | 'compareAtPriceCents'
  | 'imageUrl'
  | 'imageAlt'
  | 'imageUrl2'
  | 'dualImageMode'
  | 'isBestseller'
  | 'isOnSale'
>

/**
 * Homepage hero — narrative + 2-tile lookbook spread.
 *
 * **Why a lookbook of 2 (not a grid of 4):**
 * Clothing stores live or die on imagery. Two large editorial tiles command
 * attention; a 2×2 grid feels like a category page. The two tiles are
 * **admin-curated** via the `hero_picks` table, with auto-fallback to
 * `is_featured` then newest if the admin hasn't picked anything yet.
 *
 * Layout:
 *   - Desktop (lg+): narrative left (5 cols) | lookbook right (7 cols, side-by-side tiles)
 *   - Tablet (md):   narrative top, lookbook below side-by-side
 *   - Mobile:        narrative top, lookbook below stacked vertically
 */
export function Hero({ products }: { products: HeroProductInput[] }) {
  const t = useTranslations('home')
  const shouldReduceMotion = useReducedMotion()

  // Always render exactly 2 slots — fall through to skeletons if admin/data is empty
  const [tileA, tileB] = [products[0], products[1]]

  return (
    <section className="relative overflow-hidden bg-zinc-950 lg:min-h-[calc(92dvh-var(--ann-bar-h,0rem))]">
      {/* ── Base wash — flat dark color underneath the drifting orbs ── */}
      <div
        className="absolute inset-0 -z-20 bg-gradient-to-b from-[#09090b] via-[#09090b] to-[#0a0a0b]"
        aria-hidden
      />

      {/* ── Drifting amber orb (top-right) — reuses existing gradientFloatA keyframe ── */}
      <div
        className="pointer-events-none absolute -right-[20%] -top-[30%] -z-10 h-[80vmax] w-[80vmax] rounded-full opacity-90 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.20) 0%, transparent 65%)',
          animation: 'gradientFloatA 26s ease-in-out infinite',
          willChange: 'transform',
        }}
        aria-hidden
      />

      {/* ── Drifting pink orb (bottom-left) — reuses existing gradientFloatB keyframe ── */}
      <div
        className="pointer-events-none absolute -bottom-[30%] -left-[15%] -z-10 h-[70vmax] w-[70vmax] rounded-full opacity-80 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,45,85,0.16) 0%, transparent 65%)',
          animation: 'gradientFloatB 32s ease-in-out infinite',
          animationDelay: '-6s',
          willChange: 'transform',
        }}
        aria-hidden
      />

      {/* ── Film grain texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col gap-8 px-4 pb-12 pt-6 md:gap-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-20 lg:pt-12">
        {/* ──────────────── LEFT: narrative (5/12 on lg) ──────────────── */}
        <div className="relative flex flex-col lg:col-span-5">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: SPRING }}
            className="mb-4 flex justify-start"
          >
            <LaunchCountdownBanner position="inline" />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.1, ease: SPRING }
            }
            className="mb-3 inline-flex items-center gap-2 self-start rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300"
          >
            <Sparkles className="h-3 w-3 animate-hero-twinkle" />
            {t('heroEyebrow')}
          </motion.div>

          <h1 className="font-bold text-zinc-50 [font-size:clamp(2.25rem,5.5vw,4.25rem)] tracking-[-0.03em] leading-[1.02]">
            <AnimatedWord delay={0.2}>{t('heroLine1')}</AnimatedWord>{' '}
            <AnimatedWord
              delay={0.3}
              className="animate-hero-gold-text-sweep drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
            >
              {t('heroGold')}
            </AnimatedWord>{' '}
            <AnimatedWord
              delay={0.4}
              style={{
                fontFamily: 'var(--font-pacifico), cursive',
                color: '#ff2d55',
                textShadow: '0 0 12px rgba(255,45,85,0.6), 0 0 30px rgba(255,45,85,0.25)',
              }}
            >
              {t('heroPink')}
            </AnimatedWord>
          </h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.5, ease: SPRING }
            }
            className="mt-4 max-w-md text-sm text-zinc-400 sm:text-base md:text-lg"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.65, delay: 0.6, ease: SPRING }
            }
            className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-3"
          >
            <Link
              href="/products"
              aria-label={t('shopPremiumCollection')}
              className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 py-2 pl-6 pr-2 text-zinc-950 shadow-[0_0_30px_rgba(251,191,36,0.25)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)] active:scale-[0.97]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative text-sm font-black uppercase tracking-tight sm:text-base">
                {t('shopPremiumCollection')}
              </span>
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            <Link
              href="/account/customize"
              aria-label={t('designYourOwn')}
              className="group flex items-center justify-between gap-3 rounded-full border border-white/15 bg-white/5 py-2 pl-6 pr-2 text-zinc-200 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/35 hover:bg-white/10 active:scale-[0.97]"
            >
              <span className="text-sm font-medium sm:text-base">{t('designYourOwn')}</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </motion.div>

          <motion.ul
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.75, ease: SPRING }
            }
            className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500 sm:text-xs"
          >
            <li className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-amber-400/80" />
              {t('heroTrustPrinted')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-amber-400/80" />
              {t('heroTrustShipping')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-amber-400/80" />
              {t('heroTrustReturns')}
            </li>
          </motion.ul>
        </div>

        {/* ──────────────── RIGHT: lookbook spread (7/12 on lg) ──────────────── */}
        <div className="relative lg:col-span-7">
          {/* Overline above the spread */}
          <div className="mb-3 flex items-end justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-400/90">
              {t('heroDropLabel')}
            </p>
            <Link
              href="/products"
              className="text-[11px] font-medium text-zinc-400 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              {t('heroSeeAll')} →
            </Link>
          </div>

          {/* 2-up lookbook — side-by-side at every breakpoint so both tiles stay
              above the fold on mobile (stacking would overflow viewport height) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6">
            {tileA ? (
              <HeroLookbookTile product={tileA} index={0} priority />
            ) : (
              <div className="aspect-[4/5] rounded-3xl border border-white/[0.06] bg-zinc-900/40" />
            )}
            {tileB ? (
              <HeroLookbookTile product={tileB} index={1} />
            ) : (
              <div className="aspect-[4/5] rounded-3xl border border-white/[0.06] bg-zinc-900/40" />
            )}
          </div>
        </div>
      </div>

      {/* ── Scroll hint ── */}
      <motion.a
        href="#products"
        aria-label={t('viewCollection')}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.7, delay: 1, ease: SPRING }
        }
        // Hidden on mobile — content already overflows viewport there, so a
        // "scroll" hint is redundant and would float at the wrong position.
        className="group absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-sm transition-all hover:border-amber-400/40 hover:text-amber-400 lg:flex"
      >
        {t('viewCollection')}
        <ArrowRight className="h-3 w-3 rotate-90 transition-transform group-hover:translate-y-0.5" />
      </motion.a>
    </section>
  )
}
