'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { HeroLogo } from './HeroLogo'
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  Star,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
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
          supabase.from('product_reviews').select('rating')
        ])

        if (reviewsCount.count !== null) {
          const count = reviewsCount.count > 2000 ? reviewsCount.count : 2000
          const avg = reviewsAvg.data && reviewsAvg.data.length > 0
            ? (reviewsAvg.data.reduce((sum, r) => sum + r.rating, 0) / reviewsAvg.data.length).toFixed(1)
            : '4.8'

          setStats({
            count: Number(count),
            rating: Number(avg)
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

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Background Image - darker opacity to show image clearly but blend slightly */}
      <div className="absolute inset-0 -z-20 opacity-70">
        <Image
          src="/images/hero_bg.png"
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

      <div className="mx-auto max-w-4xl text-center">
        {/* Urgency Badge */}
        <div className="mb-8 flex justify-center">
          <div className="group flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur-md transition-all hover:bg-amber-500/20 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
            <span>{t('seasonDrops')}</span>
          </div>
        </div>
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

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button
            type="button"
            onClick={scrollToProducts}
            aria-label={t('shopPremiumCollection')}
            className="group relative flex w-full sm:w-auto flex-col items-center justify-center rounded-xl bg-white px-8 py-4 text-zinc-950 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-lg font-bold">{t('shopPremiumCollection')}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">{t('freeShippingBenefit')}</span>
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

        {/* Social Proof & Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{t('secureCheckout')}</span>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-400" />
            <span>{t('freeShipping')}</span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <span>{t('moneyBackGuarantee')}</span>
          </div>

          {/* Real Social Proof */}
          <div className="flex items-center gap-2 border-zinc-800 md:border-l md:pl-8">
            <div className="flex -space-x-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="whitespace-nowrap font-medium">
              <strong className="text-zinc-100">{stats.rating}/5</strong> {t('customerReviews', { count: stats.count.toLocaleString() })}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
