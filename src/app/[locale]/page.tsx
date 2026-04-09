import { Suspense } from 'react'
import { Hero } from '@/components/Hero'
import { NewArrivalsSection } from '@/components/product/NewArrivalsSection'
import { FeaturedProductsSection } from '@/components/product/FeaturedProductsSection'
import { ProductCarouselSkeleton } from '@/components/product/ProductCarouselSkeleton'
import { AllProductsSection } from '@/components/product/AllProductsSection'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { GalleryPreviewSection } from '@/components/gallery/GalleryPreviewSection'
import { AuthCTASection } from '@/components/auth/AuthCTASection'
import { SocialSection } from '@/components/social/SocialSection'
import { CustomDesignSection } from '@/components/custom/CustomDesignSection'
import FeedSection from '@/components/feed/FeedSection'
import { CategoryStrip } from '@/components/category/CategoryStrip'
import { fetchHomeProducts } from '@/actions/products'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('home')
  const description = t('metaDescription')
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'
  const title = t('homeMetaTitle')

  return {
    title,
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

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('home')
  const supabase = await createClient()

  // Fetch all product sets in a single parallel round-trip.
  // FeaturedProductsSection and NewArrivalsSection receive these as props
  // so they never call fetchHomeProducts themselves.
  const [initialProducts, featuredProducts, newestProducts, activePtData] = await Promise.all([
    fetchHomeProducts('newest'),
    fetchHomeProducts({ featured: true, limit: 8 }),
    fetchHomeProducts({ sort: 'newest', limit: 10 }),
    supabase
      .from('product_tags')
      .select('tag_id, products!inner(id)')
      .eq('products.is_active', true)
      .is('products.deleted_at', null),
  ])

  const activeTagIds = [...new Set((activePtData.data ?? []).map((pt) => pt.tag_id))]
  const { data: tagsData } =
    activeTagIds.length > 0
      ? await supabase
          .from('tags')
          .select('id, name, slug')
          .in('id', activeTagIds)
          .order('name', { ascending: true })
      : { data: [] }

  return (
    <div>
      <Hero />

      <Suspense fallback={<ProductCarouselSkeleton />}>
        <FeaturedProductsSection products={featuredProducts} />
      </Suspense>

      {/* Diagonal slash transition — dark → gradient */}
      <div className="relative -mb-1 h-20 overflow-hidden">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="0,0 1440,0 1440,20 0,80" fill="#09090b" />
          <line x1="0" y1="80" x2="1440" y2="20" stroke="rgba(251,191,36,0.15)" strokeWidth="2" />
        </svg>
      </div>

      <Suspense fallback={null}>
        <NewArrivalsSection products={newestProducts} />
      </Suspense>

      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 h-64 animate-pulse" />}>
        <CategoryStrip />
      </Suspense>

      <div id="products" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-4">
        <AllProductsSection initialProducts={initialProducts} tags={tagsData ?? []} />
      </div>

      <GalleryPreviewSection />
      <CustomDesignSection />
      <Suspense fallback={null}>
        <FeedSection locale={locale} />
      </Suspense>
      <SocialSection />
      <AuthCTASection />
    </div>
  )
}
