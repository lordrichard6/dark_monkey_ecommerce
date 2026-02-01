'use client'

import Link from 'next/link'
import { HeroLogo } from '@/components/HeroLogo'

export function Hero() {
  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden border-b border-white/10 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <HeroLogo />
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            Premium
          </span>
          {' quality, crafted for '}
          <span
            className="font-[family-name:var(--font-pacifico)] font-normal"
            style={{
              fontFamily: 'var(--font-pacifico), cursive',
              color: '#ff2d55',
              textShadow:
                '0 0 5px #ff2d55, 0 0 10px #ff2d55, 0 0 20px #ff2d55, 0 0 40px #ff2d55',
            }}
          >
            you
          </span>
        </h1>
        <p className="mt-6 text-lg text-zinc-400 md:text-xl">
          For customers who demand quality and premium brands.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={scrollToProducts}
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Shop now
          </button>
          <Link
            href="/categories"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/40 hover:bg-white/10"
          >
            Browse categories
          </Link>
        </div>
      </div>
    </section>
  )
}
