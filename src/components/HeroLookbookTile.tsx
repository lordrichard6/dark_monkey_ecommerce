'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowUpRight } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import type { HomeProduct } from '@/actions/products'

type LookbookProduct = Pick<
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
 * Lookbook tile — full-bleed editorial product card for the homepage hero.
 *
 * Persistent motion built in (all GPU-cheap, all auto-paused under
 * `prefers-reduced-motion` via the global override in globals.css):
 *   - Slow Ken Burns drift on the primary image (paused on hover)
 *   - Auto-rotates to the secondary "alt shot" every ~5s when dualImageMode is on
 *     (per-tile staggered) so mobile users see the reveal too
 *   - Hover-only "SHOP ↗" chip + scale on the wrapper
 *
 * Whole tile is the click target → straight to the PDP.
 */
export function HeroLookbookTile({
  product,
  index,
  priority = false,
}: {
  product: LookbookProduct
  index: number
  priority?: boolean
}) {
  const t = useTranslations('home')
  const shouldReduceMotion = useReducedMotion()

  // Auto-rotate primary ↔ secondary image on a per-tile staggered cadence.
  // Disabled if no secondary or if user prefers reduced motion.
  const [showAlt, setShowAlt] = useState(false)
  useEffect(() => {
    if (shouldReduceMotion) return
    if (!product.dualImageMode || !product.imageUrl2) return
    const period = 5200 + index * 900 // 5.2s, 6.1s — feels organic, not in lockstep
    const id = setInterval(() => setShowAlt((s) => !s), period)
    return () => clearInterval(id)
  }, [product.dualImageMode, product.imageUrl2, index, shouldReduceMotion])

  const discountPct =
    product.isOnSale && product.compareAtPriceCents
      ? Math.round(
          ((product.compareAtPriceCents - product.priceCents) / product.compareAtPriceCents) * 100
        )
      : 0

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.85, delay: 0.4 + index * 0.12, ease: [0.32, 0.72, 0, 1] }
      }
      className="group relative"
    >
      <Link
        href={`/products/${product.slug}`}
        prefetch
        className="relative block overflow-hidden rounded-3xl border border-white/[0.06] bg-zinc-950 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-amber-400/30 hover:shadow-[0_32px_80px_-20px_rgba(251,191,36,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        {/* Portrait crop — tall, cinematic */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950">
          {product.imageUrl ? (
            <>
              {/* Primary image — Ken Burns drift, fades out when alt is showing */}
              <Image
                src={product.imageUrl}
                alt={product.imageAlt}
                fill
                sizes="(min-width: 1280px) 360px, (min-width: 1024px) 28vw, 45vw"
                priority={priority}
                className={`animate-hero-ken-burns object-cover object-center transition-opacity duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  showAlt ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {/* Secondary image — fades in on auto-rotate OR hover */}
              {product.dualImageMode && product.imageUrl2 ? (
                <Image
                  src={product.imageUrl2}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 360px, (min-width: 1024px) 28vw, 45vw"
                  className={`object-cover object-center transition-opacity duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100 ${
                    showAlt ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-zinc-600">
              —
            </div>
          )}

          {/* Bottom gradient — keeps the name legible without darkening the whole image */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent"
            aria-hidden
          />

          {/* Top badge stack — discount + bestseller (both i18n) */}
          <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
            {discountPct > 0 ? (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg sm:px-2.5 sm:py-1 sm:text-[11px]">
                −{discountPct}%
              </span>
            ) : null}
            {product.isBestseller ? (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-lg sm:px-2.5 sm:py-1 sm:text-[11px]">
                ★ {t('heroTileBestseller')}
              </span>
            ) : null}
          </div>

          {/* Hover-only quick action chip — desktop affordance */}
          <div className="absolute right-2 top-2 translate-y-1 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:right-3 sm:top-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              {t('heroTileShop')} <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>

          {/* Bottom strip — name + price */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:gap-3 sm:p-4 md:p-5">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xs font-bold uppercase tracking-tight text-white drop-shadow-md sm:text-base md:text-lg lg:text-xl">
                {product.name}
              </h3>
            </div>
            <div className="shrink-0 text-right">
              {product.isOnSale && product.compareAtPriceCents ? (
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-[9px] text-white/60 line-through sm:text-[10px]">
                    {formatPrice(product.compareAtPriceCents)}
                  </span>
                  <span className="text-xs font-bold text-amber-300 drop-shadow-md sm:text-sm md:text-base">
                    {formatPrice(product.priceCents)}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-bold text-white drop-shadow-md sm:text-sm md:text-base">
                  {formatPrice(product.priceCents)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
