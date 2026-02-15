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

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string; tag?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('home')
  return {
    description: t('metaDescription'),
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

      <div id="products" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-4">
        <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-lg bg-zinc-900/50 mb-8" />}>
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
