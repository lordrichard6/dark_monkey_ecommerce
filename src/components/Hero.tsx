'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { HeroLogo } from './HeroLogo'
import { ArrowRight } from 'lucide-react'
import { LaunchCountdownBanner } from './LaunchCountdownBanner'

// Staggered entrance — fires after mount with a per-element delay
function FadeUp({
  children,
  delay,
  className,
}: {
  children: React.ReactNode
  delay: number
  className?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(24px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '0.7s',
        transitionTimingFunction: 'ease',
      }}
    >
      {children}
    </div>
  )
}

export function Hero() {
  const t = useTranslations('home')

  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  const locale = useLocale()

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Background video */}
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-70"
        src="/videos/dm_hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Dark Overlay/Gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-black/50 to-black/30" />

      <div className="mx-auto max-w-4xl text-center">

        {/* 1 — Badge */}
        <FadeUp delay={0} className="mb-8 mt-12 flex justify-center md:mt-8">
          <LaunchCountdownBanner position="inline" />
        </FadeUp>

        {/* 2 — Logo */}
        <FadeUp delay={150}>
          <HeroLogo />
        </FadeUp>

        {/* 3 — Title */}
        <FadeUp delay={300}>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl lg:text-6xl">
            {locale === 'pt' ? (
              <>
                {t('quality')}{' '}
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {t('premium')}
                </span>{' '}
                {t('craftedFor')}{' '}
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {t('premium')}
                </span>{' '}
                {t('qualityCraftedFor')}{' '}
              </>
            )}
            <span
              className="font-[family-name:var(--font-pacifico)] font-normal"
              style={{
                fontFamily: 'var(--font-pacifico), cursive',
                color: '#ff2d55',
                textShadow: '0 0 5px #ff2d55, 0 0 10px #ff2d55, 0 0 20px #ff2d55, 0 0 40px #ff2d55',
              }}
            >
              {t('you')}
            </span>
          </h1>
        </FadeUp>

        {/* 4 — Subtitle */}
        <FadeUp delay={450}>
          <p className="mt-6 text-base text-zinc-400 sm:text-lg md:text-xl">{t('heroSubtitle')}</p>
        </FadeUp>

        {/* 5 — Buttons */}
        <FadeUp delay={600} className="mt-10 flex flex-col sm:flex-row justify-center gap-4 px-4">
          <button
            type="button"
            onClick={scrollToProducts}
            aria-label={t('shopPremiumCollection')}
            className="group relative flex w-full sm:w-auto items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 px-6 py-3 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] active:scale-[0.98] md:px-10 md:py-5"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative text-xl font-black uppercase tracking-tight">
              {t('shopPremiumCollection')}
            </span>
          </button>

          <Link
            href="/categories"
            aria-label={t('exploreByCategory')}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/20 px-5 py-3 text-zinc-200 transition-all hover:border-white/40 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm md:px-8 md:py-4"
          >
            <span className="text-lg font-medium">{t('exploreByCategory')}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </FadeUp>

      </div>
    </section>
  )
}
