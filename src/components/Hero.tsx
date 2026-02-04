'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { HeroLogo } from '@/components/HeroLogo'

export function Hero() {
  const t = useTranslations('home')
  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden border-b border-white/10 px-4">
      {/* Background Image - darker opacity to show image clearly but blend slightly */}
      <div className="absolute inset-0 -z-20 opacity-70">
        <Image
          src="/images/hero_bg.png"
          alt="Dark Monkey Hero"
          fill
          className="object-[35%_center] object-cover md:object-center"
          priority
        />
      </div>
      {/* Dark Overlay/Gradient - lighter at bottom to fade into content */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-black/50 to-black/30" />

      <div className="mx-auto max-w-4xl text-center">
        <HeroLogo />
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            {t('premium')}
          </span>
          {' '}{t('qualityCraftedFor')}{' '}
          <span
            className="font-[family-name:var(--font-pacifico)] font-normal"
            style={{
              fontFamily: 'var(--font-pacifico), cursive',
              color: '#ff2d55',
              textShadow:
                '0 0 5px #ff2d55, 0 0 10px #ff2d55, 0 0 20px #ff2d55, 0 0 40px #ff2d55',
            }}
          >
            {t('you')}
          </span>
        </h1>
        <p className="mt-6 text-lg text-zinc-400 md:text-xl">
          {t('heroSubtitle')}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={scrollToProducts}
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            {t('shopNow')}
          </button>
          <Link
            href="/categories"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/40 hover:bg-white/10"
          >
            {t('browseCategories')}
          </Link>
        </div>
      </div>
    </section>
  )
}
