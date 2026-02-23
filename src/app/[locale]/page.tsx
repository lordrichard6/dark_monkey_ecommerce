import { Suspense } from 'react'
import { Hero } from '@/components/Hero'
import { FeaturedProducts } from '@/components/product/FeaturedProducts'
import { NewArrivalsSection } from '@/components/product/NewArrivalsSection'
import { TagFilterSection } from '@/components/product/TagFilterSection'
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton'
import { ProductCarouselSkeleton } from '@/components/product/ProductCarouselSkeleton'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { GalleryPreviewSection } from '@/components/gallery/GalleryPreviewSection'
import { AuthCTASection } from '@/components/auth/AuthCTASection'
import { Link } from '@/i18n/navigation'
import { CategoryStrip } from '@/components/category/CategoryStrip'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ sort?: string; tag?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('home')
  const description = t('metaDescription')
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'
  const title = 'DarkMonkey — Premium quality e-commerce'

  return {
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ISR: Revalidate home page every 10 minutes
export const revalidate = 600

export default async function HomePage({ params, searchParams }: Props) {
  const { sort = 'newest', tag } = await searchParams
  const t = await getTranslations('home')

  return (
    <div>
      <Hero />

      <Suspense fallback={<ProductCarouselSkeleton />}>
        <NewArrivalsSection />
      </Suspense>

      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 h-64 animate-pulse" />}>
        <CategoryStrip />
      </Suspense>

      <div id="products" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-4">
        <Suspense
          fallback={<div className="h-12 w-full animate-pulse rounded-lg bg-zinc-900/50 mb-8" />}
        >
          <TagFilterSection selectedTag={tag} />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton />}>
          <FeaturedProducts sort={sort} tag={tag} />
        </Suspense>

        {!tag && (
          <div className="mt-8 text-center">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
            >
              {t('seeAllProducts')}
            </Link>
          </div>
        )}
      </div>

      <GalleryPreviewSection />
      <AuthCTASection />
    </div>
  )
}
