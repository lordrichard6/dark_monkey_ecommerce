import type { MetadataRoute } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import { getAllSlugs } from '@/content/blog'
import { SITE_URL as BASE_URL } from '@/lib/site-config'

const locales = routing.locales

type SitemapChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

function localizedUrls(
  path: string,
  lastModified?: Date,
  options?: { priority?: number; changeFrequency?: SitemapChangeFreq }
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: lastModified ?? new Date(),
    ...(options?.priority !== undefined ? { priority: options.priority } : {}),
    ...(options?.changeFrequency ? { changeFrequency: options.changeFrequency } : {}),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`])),
    },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminClient()

  // Blog pages
  const blogSlugs = getAllSlugs()
  const blogPages: MetadataRoute.Sitemap = [
    ...localizedUrls('/blog', undefined, { priority: 0.7, changeFrequency: 'weekly' }),
    ...blogSlugs.flatMap((slug) =>
      localizedUrls(`/blog/${slug}`, undefined, { priority: 0.6, changeFrequency: 'monthly' })
    ),
  ]

  // Static pages — priority reflects importance for crawl budget
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage — highest priority
    ...localizedUrls('/', undefined, { priority: 1.0, changeFrequency: 'daily' }),
    // Core commerce pages
    ...localizedUrls('/products', undefined, { priority: 0.9, changeFrequency: 'daily' }),
    ...localizedUrls('/categories', undefined, { priority: 0.9, changeFrequency: 'weekly' }),
    ...localizedUrls('/bundles', undefined, { priority: 0.8, changeFrequency: 'weekly' }),
    // Utility pages
    ...localizedUrls('/search', undefined, { priority: 0.4, changeFrequency: 'monthly' }),
    ...localizedUrls('/contact', undefined, { priority: 0.5, changeFrequency: 'yearly' }),
    // Legal / policy — low priority, rarely change
    ...localizedUrls('/privacy', undefined, { priority: 0.2, changeFrequency: 'yearly' }),
    ...localizedUrls('/terms', undefined, { priority: 0.2, changeFrequency: 'yearly' }),
    ...localizedUrls('/refund', undefined, { priority: 0.3, changeFrequency: 'yearly' }),
    ...localizedUrls('/shipping', undefined, { priority: 0.3, changeFrequency: 'yearly' }),
    ...blogPages,
  ]

  if (!supabase) {
    return staticPages
  }

  // Dynamic product pages — high priority (conversion-critical)
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)
    .is('deleted_at', null)

  const productPages: MetadataRoute.Sitemap = (products ?? []).flatMap((product) =>
    localizedUrls(`/products/${product.slug}`, new Date(product.updated_at), {
      priority: 0.8,
      changeFrequency: 'weekly',
    })
  )

  // Dynamic category pages — high priority (hub pages)
  const { data: categories } = await supabase.from('categories').select('slug, updated_at')

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).flatMap((category) =>
    localizedUrls(`/categories/${category.slug}`, new Date(category.updated_at), {
      priority: 0.8,
      changeFrequency: 'weekly',
    })
  )

  return [...staticPages, ...productPages, ...categoryPages]
}
