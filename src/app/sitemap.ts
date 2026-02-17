import type { MetadataRoute } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'
const locales = routing.locales

function localizedUrls(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: lastModified ?? new Date(),
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
      ),
    },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    ...localizedUrls('/'),
    ...localizedUrls('/products'),
    ...localizedUrls('/categories'),
    ...localizedUrls('/contact'),
    ...localizedUrls('/privacy'),
    ...localizedUrls('/terms'),
    ...localizedUrls('/refund'),
    ...localizedUrls('/shipping'),
  ]

  if (!supabase) {
    return staticPages
  }

  // Dynamic product pages
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)
    .is('deleted_at', null)

  const productPages: MetadataRoute.Sitemap = (products ?? []).flatMap((product) =>
    localizedUrls(`/products/${product.slug}`, new Date(product.updated_at))
  )

  // Dynamic category pages
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).flatMap((category) =>
    localizedUrls(`/categories/${category.slug}`, new Date(category.updated_at))
  )

  return [...staticPages, ...productPages, ...categoryPages]
}
