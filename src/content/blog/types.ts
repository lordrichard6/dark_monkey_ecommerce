export type BlogArticleType = 'story' | 'guide' | 'update' | 'culture'

export type BlogLocale = 'en' | 'pt' | 'de' | 'fr' | 'it'

export type BlogLocaleContent = {
  title: string
  description: string // SEO meta description, ~155 chars
  body: string // HTML string, rendered with dangerouslySetInnerHTML
}

export type BlogArticle = {
  slug: string // used in URL: /en/blog/[slug]
  type: BlogArticleType
  publishedAt: string // ISO date string e.g. "2026-04-05"
  coverImage?: string // optional URL
  readingTimeMinutes?: number // optional — auto-calculated if omitted
  content: Partial<Record<BlogLocale, BlogLocaleContent>>
}

/** Strips HTML tags and counts words to estimate reading time at 200 wpm */
export function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
