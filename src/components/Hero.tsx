'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { HeroLogo } from './HeroLogo'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { LaunchCountdownBanner } from './LaunchCountdownBanner'

export function Hero() {
  const t = useTranslations('home')

  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  const locale = useLocale()

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Background Image - darker opacity to show image clearly but blend slightly */}
      <div className="absolute inset-0 -z-20 opacity-70">
        <Image
          src="/images/hero_bg_hd.png"
          alt="Dark Monkey Hero"
          fill
          className="object-cover object-center"
          priority
          quality={90}
          sizes="100vw"
        />
      </div>
      {/* Dark Overlay/Gradient - lighter at bottom to fade into content */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-black/50 to-black/30" />

      <div className="mx-auto max-w-4xl text-center">
        {/* Urgency Badge */}
        <div className="mb-8 mt-12 flex justify-center md:mt-8">
          <div className="group flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur-md transition-all hover:bg-amber-500/20 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
            <span>{t('seasonDrops')}</span>
          </div>
        </div>
        <HeroLogo />
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
        <p className="mt-6 text-base text-zinc-400 sm:text-lg md:text-xl">{t('heroSubtitle')}</p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 px-4">
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
        </div>

        <LaunchCountdownBanner />
      </div>
    </section>
  )
}
