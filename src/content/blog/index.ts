import darkMonkeyStory from './dark-monkey-story'
import type { BlogArticle } from './types'
import { calculateReadingTime } from './types'

export const allArticles: BlogArticle[] = [darkMonkeyStory]

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return allArticles.find((a) => a.slug === slug)
}

export function getAllSlugs(): string[] {
  return allArticles.map((a) => a.slug)
}

/** Returns reading time — uses article's value if set, otherwise auto-calculates from EN body */
export function getReadingTime(article: BlogArticle): number {
  if (article.readingTimeMinutes) return article.readingTimeMinutes
  const enBody = article.content.en?.body ?? ''
  return calculateReadingTime(enBody)
}
