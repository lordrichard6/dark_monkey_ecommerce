import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getArticleBySlug, getAllSlugs, getReadingTime } from '@/content/blog'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'
const LOCALES = ['en', 'pt', 'de', 'fr', 'it'] as const

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export const revalidate = false
export const dynamicParams = false

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  story: { label: 'Story', className: 'bg-amber-400/10 text-amber-400' },
  guide: { label: 'Guide', className: 'bg-blue-400/10 text-blue-400' },
  update: { label: 'Update', className: 'bg-emerald-400/10 text-emerald-400' },
  culture: { label: 'Culture', className: 'bg-purple-400/10 text-purple-400' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return { title: 'Article not found | Dark Monkey' }
  }

  const content = article.content[locale as keyof typeof article.content] ?? article.content['en']

  const title = content?.title ?? 'Dark Monkey Blog'
  const description = content?.description ?? ''

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/${slug}`,
      languages: {
        en: `${SITE_URL}/en/blog/${slug}`,
        pt: `${SITE_URL}/pt/blog/${slug}`,
        de: `${SITE_URL}/de/blog/${slug}`,
        fr: `${SITE_URL}/fr/blog/${slug}`,
        it: `${SITE_URL}/it/blog/${slug}`,
        'x-default': `${SITE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/${locale}/blog/${slug}`,
      publishedTime: article.publishedAt,
      siteName: 'Dark Monkey',
      locale,
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(article.coverImage ? { images: [article.coverImage] } : {}),
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const content = article.content[locale as keyof typeof article.content] ?? article.content['en']

  if (!content) notFound()

  const date = new Date(article.publishedAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const typeConfig = TYPE_CONFIG[article.type] ?? TYPE_CONFIG.story

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 min-h-screen">
      <div className="mb-10">
        <Link
          href="/blog"
          className="text-sm text-zinc-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
        >
          ← Blog
        </Link>
      </div>

      <header className="mb-8">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium mb-4 ${typeConfig.className}`}
        >
          {typeConfig.label}
        </span>
        <h1 className="text-3xl font-bold text-zinc-50 leading-tight mb-4">{content.title}</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span>{date}</span>
          <span>·</span>
          <span>{getReadingTime(article)} min read</span>
        </div>
      </header>

      <hr className="border-zinc-800 mb-10" />

      <div className="blog-body max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: content.title,
            description: content.description,
            datePublished: article.publishedAt,
            inLanguage: locale,
            publisher: {
              '@type': 'Organization',
              name: 'Dark Monkey',
              url: SITE_URL,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${SITE_URL}/${locale}/blog/${slug}`,
            },
            ...(article.coverImage ? { image: article.coverImage } : {}),
          }),
        }}
      />
    </article>
  )
}
