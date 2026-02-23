'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { HeroLogo } from './HeroLogo'
import { CheckCircle2, Truck, ShieldCheck, Star, ArrowRight, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Hero() {
  const t = useTranslations('home')
  const [stats, setStats] = useState({ count: 2000, rating: 4.8 })

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()
        const [reviewsCount, reviewsAvg] = await Promise.all([
          supabase.from('product_reviews').select('*', { count: 'exact', head: true }),
          supabase.from('product_reviews').select('rating'),
        ])

        if (reviewsCount.count !== null) {
          const count = reviewsCount.count > 2000 ? reviewsCount.count : 2000
          const avg =
            reviewsAvg.data && reviewsAvg.data.length > 0
              ? (
                  reviewsAvg.data.reduce((sum, r) => sum + r.rating, 0) / reviewsAvg.data.length
                ).toFixed(1)
              : '4.8'

          setStats({
            count: Number(count),
            rating: Number(avg),
          })
        }
      } catch (error) {
        console.error('Error fetching hero stats:', error)
      }
    }
    fetchStats()
  }, [])

  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  const locale = useLocale()

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Background Image - darker opacity to show image clearly but blend slightly */}
      <div className="absolute inset-0 -z-20 opacity-70">
        <Image
          src="/images/hero_bg.webp"
          alt="Dark Monkey Hero"
          fill
          className="object-[35%_center] object-cover md:object-center"
          priority
          quality={90}
          sizes="100vw"
        />
      </div>
      {/* Dark Overlay/Gradient - lighter at bottom to fade into content */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-black/50 to-black/30" />

      {/* Dev Watermark */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
        {/* Rotated banner across the hero */}
        <div
          className="relative flex flex-col items-center gap-1 -rotate-[18deg] select-none"
          style={{ width: '140%' }}
        >
          {/* Repeating stripe background */}
          <div className="w-full overflow-hidden">
            <div
              className="flex items-center justify-center gap-8 py-4 px-8"
              style={{
                background:
                  'repeating-linear-gradient(90deg, rgba(239,68,68,0.12) 0px, rgba(239,68,68,0.12) 40px, transparent 40px, transparent 80px)',
                borderTop: '1px solid rgba(239,68,68,0.3)',
                borderBottom: '1px solid rgba(239,68,68,0.3)',
                backdropFilter: 'blur(2px)',
              }}
            >
              {/* Repeated text across full width */}
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-xs font-black uppercase tracking-[0.35em] text-red-400/70"
                    style={{ textShadow: '0 0 12px rgba(239,68,68,0.5)' }}
                  >
                    {t('devBannerTitle')}
                  </span>
                  <span className="text-red-500/40 text-xs">✕</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dev Badge - top right corner */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none select-none">
        <div
          className="flex flex-col items-end gap-0.5 rounded-lg px-3 py-2"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(239,68,68,0.4)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 20px rgba(239,68,68,0.15), inset 0 0 20px rgba(239,68,68,0.05)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"
              style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)' }}
            />
            <span
              className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400"
              style={{ textShadow: '0 0 8px rgba(239,68,68,0.6)' }}
            >
              {t('devBannerTitle')}
            </span>
          </div>
          <span className="text-[9px] font-medium tracking-wide text-red-300/60 ml-3">
            {t('devBannerSubtitle')}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Urgency Badge */}
        <div className="mb-8 mt-12 flex justify-center md:mt-8">
          <div className="group flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur-md transition-all hover:bg-amber-500/20 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
            <span>{t('seasonDrops')}</span>
          </div>
        </div>
        <HeroLogo />
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
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
        <p className="mt-6 text-lg text-zinc-400 md:text-xl">{t('heroSubtitle')}</p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 px-4">
          <button
            type="button"
            onClick={scrollToProducts}
            aria-label={t('shopPremiumCollection')}
            className="group relative flex w-full sm:w-auto items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 px-10 py-5 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] active:scale-[0.98] md:px-12"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative text-xl font-black uppercase tracking-tight">
              {t('shopPremiumCollection')}
            </span>
          </button>

          <Link
            href="/categories"
            aria-label={t('exploreByCategory')}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/20 px-8 py-4 text-zinc-200 transition-all hover:border-white/40 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
          >
            <span className="text-lg font-medium">{t('exploreByCategory')}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
