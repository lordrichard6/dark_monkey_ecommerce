import { getBundles } from '@/actions/bundles'
import { BundleAddToCart } from '@/components/product/BundleAddToCart'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Package } from 'lucide-react'

// ISR: Revalidate every 10 minutes
export const revalidate = 600

type Props = {
  params: Promise<{ locale: string }>
}

const SUPPORTED_LOCALES = ['en', 'pt', 'de', 'it', 'fr'] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('bundles')
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch').replace(
    /\/$/,
    ''
  )
  const title = `${t('title')} — DarkMonkey`
  const description = t('description')
  const url = `${siteUrl}/${locale}/bundles`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, `${siteUrl}/${loc}/bundles`])
      ),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DarkMonkey',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function BundlesPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('bundles')
  const bundles = await getBundles(locale)

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="gradient-orb gradient-orb-orange-1" style={{ opacity: 0.25 }} />
        <div className="gradient-orb gradient-orb-purple-1" style={{ opacity: 0.15 }} />
      </div>

      {/* Hero */}
      <div className="relative -mx-4 -mt-14 border-b border-white/5 bg-zinc-950/60 backdrop-blur-sm md:-ml-20">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-24 md:pb-14 md:pt-28">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-amber-400 uppercase">
                <Package className="h-3.5 w-3.5" />
                {t('title')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                {t('heading')}
              </h1>
              <p className="mt-3 text-base text-zinc-400 md:text-lg">{t('subheading')}</p>
            </div>

            {bundles.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3 text-center backdrop-blur-sm flex-shrink-0">
                <div className="text-2xl font-bold text-amber-400">{bundles.length}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{t('title')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bundles list */}
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        {bundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-12 w-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">{t('noResults')}</p>
          </div>
        ) : (
          bundles.map((bundle) => (
            <article
              key={bundle.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black transition-all hover:border-amber-500/30"
            >
              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
                {/* Bundle image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800 md:w-72 md:flex-shrink-0">
                  {bundle.image_url ? (
                    <Image
                      src={bundle.image_url}
                      alt={bundle.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 288px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-black text-zinc-700 select-none">
                      BUNDLE
                    </div>
                  )}
                  {bundle.discount_percentage > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow">
                        {t('save')} {bundle.discount_percentage}% {t('off')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bundle details */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white md:text-2xl">{bundle.name}</h2>
                  {bundle.description && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {bundle.description}
                    </p>
                  )}

                  {/* Product items preview */}
                  {bundle.items.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {bundle.items.map((item) => (
                        <div key={item.variantId} className="flex items-center gap-2">
                          {item.imageUrl && (
                            <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-zinc-800 flex-shrink-0">
                              <Image
                                src={item.imageUrl}
                                alt={item.productName}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-xs text-zinc-500 max-w-[100px] truncate">
                            {item.productName}
                          </span>
                        </div>
                      ))}
                      <span className="self-center text-xs text-zinc-600">
                        · {bundle.items.length} {t('items')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing + CTA */}
                <BundleAddToCart
                  items={bundle.items}
                  totalCents={bundle.totalCents}
                  originalTotalCents={bundle.originalTotalCents}
                  discountPercentage={bundle.discount_percentage}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
