import { Suspense } from 'react'
import { Hero } from '@/components/Hero'
import { NewArrivalsSection } from '@/components/product/NewArrivalsSection'
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
import { RecentlyViewed } from '@/components/product/RecentlyViewed'
import { fetchHomeProducts, fetchHeroProducts } from '@/actions/products'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

const SUPPORTED_LOCALES = ['en', 'pt', 'de', 'it', 'fr'] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('home')
  const description = t('metaDescription')
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'
  const title = t('homeMetaTitle')

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `${SITE_URL}/${l}`])),
        'x-default': `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: 'Dark Monkey',
      locale,
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
  // The hero now curates its own picks (admin-set, with fallback), so we no
  // longer need a separate "featured" carousel section — it duplicated what
  // the hero already shows. NewArrivalsSection and AllProductsSection take
  // their data as props so they don't re-fetch on render.
  const [initialProducts, newestProducts, heroProducts, activeTagsData] = await Promise.all([
    // Cap initial fetch — AllProductsSection only renders 8 with a "See all"
    // link to /products, so pulling more than 24 from DB was wasteful.
    fetchHomeProducts({ sort: 'newest', limit: 24 }),
    fetchHomeProducts({ sort: 'newest', limit: 10 }),
    // Admin-curated 2 hero picks (with featured/newest fallback so it's never empty)
    fetchHeroProducts(),
    // Single denormalized query for active tags — was previously a tag_id
    // lookup followed by a serial second query for tag details.
    supabase
      .from('tags')
      .select('id, name, slug, product_tags!inner(products!inner(id, is_active, deleted_at))')
      .eq('product_tags.products.is_active', true)
      .is('product_tags.products.deleted_at', null)
      .order('name', { ascending: true }),
  ])

  // Dedupe — a tag matched once per active product, we only need it listed once.
  const tagsData = Array.from(
    new Map(
      (activeTagsData.data ?? []).map((row) => [
        row.id,
        { id: row.id, name: row.name, slug: row.slug },
      ])
    ).values()
  )

  // FAQ JSON-LD — answers Google's "People also ask" carousel for clothing-store
  // intents (shipping, returns, on-demand printing, custom design). Localized via
  // existing home.faqQ*/faqA* keys, so non-English locales emit translated FAQs too.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      '@type': 'Question',
      name: t(`faqQ${i}` as 'faqQ1'),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`faqA${i}` as 'faqA1'),
      },
    })),
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero products={heroProducts} />

      {/* Visual beat — subtle amber gradient line between major sections so the
          stack of dark-on-dark sections doesn't read as one undifferentiated wall */}
      <SectionDivider tone="amber" />

      <Suspense fallback={<ProductCarouselSkeleton />}>
        <NewArrivalsSection products={newestProducts} />
      </Suspense>

      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 h-64 animate-pulse" />}>
        <CategoryStrip />
      </Suspense>

      {/* Recently viewed — only renders when the user has history (client-side no-op otherwise).
          Placed here so returning visitors re-engage with products they already liked. */}
      <div className="mx-auto max-w-6xl px-4">
        <RecentlyViewed />
      </div>

      <SectionDivider tone="pink" />

      <div id="products" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-4">
        <AllProductsSection initialProducts={initialProducts} tags={tagsData} />
      </div>

      <SectionDivider tone="amber" />

      <GalleryPreviewSection />
      <CustomDesignSection />
      <Suspense fallback={null}>
        <FeedSection locale={locale} />
      </Suspense>
      <SocialSection />
      <AuthCTASection />

      {/* SEO content block — keyword-rich, crawlable internal links.
          Renders on every locale, helps non-brand discovery. */}
      <section aria-label={t('seoSectionTitle')} className="border-t border-white/5 bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="mb-4 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t('seoSectionTitle')}
          </h2>
          <p className="mb-8 max-w-3xl text-zinc-400 leading-relaxed">{t('seoSectionBody')}</p>

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-400">
            {t('seoLinksTitle')}
          </h3>
          <ul className="grid grid-cols-2 gap-3 text-sm text-zinc-300 sm:grid-cols-3 md:grid-cols-4">
            <li>
              <Link href="/products?tag=t-shirts" className="hover:text-amber-400">
                {t('seoLinkTshirts')}
              </Link>
            </li>
            <li>
              <Link href="/products?tag=hoodies" className="hover:text-amber-400">
                {t('seoLinkHoodies')}
              </Link>
            </li>
            <li>
              <Link href="/products?tag=hats" className="hover:text-amber-400">
                {t('seoLinkHats')}
              </Link>
            </li>
            <li>
              <Link href="/products?tag=accessories" className="hover:text-amber-400">
                {t('seoLinkAccessories')}
              </Link>
            </li>
            <li>
              <Link href="/account/customize" className="hover:text-amber-400">
                {t('seoLinkCustom')}
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-amber-400">
                {t('seoLinkAllProducts')}
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-amber-400">
                {t('seoLinkAllCategories')}
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-amber-400">
                {t('seoLinkBlog')}
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

/**
 * Thin gradient divider — gives the eye a beat between major sections.
 * Pure decoration, GPU-cheap (no animation, no image, just a 1px line).
 * `tone` swaps between the two brand colors so consecutive dividers don't
 * look identical.
 */
function SectionDivider({ tone = 'amber' }: { tone?: 'amber' | 'pink' }) {
  const color = tone === 'amber' ? 'rgba(251,191,36,0.18)' : 'rgba(255,45,85,0.16)'
  return (
    <div className="relative mx-auto h-px max-w-6xl px-4" aria-hidden>
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }}
      />
    </div>
  )
}
