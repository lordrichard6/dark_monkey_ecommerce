import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
