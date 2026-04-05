import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { allArticles, getReadingTime } from '@/content/blog'

type Props = {
  params: Promise<{ locale: string }>
}

const titles: Record<string, string> = {
  en: 'Blog | Dark Monkey',
  pt: 'Blog | Dark Monkey',
  de: 'Blog | Dark Monkey',
  fr: 'Blog | Dark Monkey',
  it: 'Blog | Dark Monkey',
}

const descriptions: Record<string, string> = {
  en: 'Stories, culture and updates from Dark Monkey.',
  pt: 'Histórias, cultura e novidades da Dark Monkey.',
  de: 'Geschichten, Kultur und Neuigkeiten von Dark Monkey.',
  fr: 'Histoires, culture et actualités de Dark Monkey.',
  it: 'Storie, cultura e aggiornamenti da Dark Monkey.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
  }
}

export const revalidate = false

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  story: { label: 'Story', className: 'text-amber-400' },
  guide: { label: 'Guide', className: 'text-blue-400' },
  update: { label: 'Update', className: 'text-emerald-400' },
  culture: { label: 'Culture', className: 'text-purple-400' },
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 min-h-screen">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-zinc-50 mb-3">Blog</h1>
        <p className="text-zinc-400 text-lg">Stories, culture and the world behind the brand.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allArticles.map((article) => {
          const localeContent =
            article.content[locale as keyof typeof article.content] ?? article.content['en']

          if (!localeContent) return null

          const title = localeContent.title
          const description =
            localeContent.description.length > 120
              ? localeContent.description.slice(0, 120) + '…'
              : localeContent.description

          const date = new Date(article.publishedAt).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          const typeBadge = TYPE_BADGE[article.type] ?? TYPE_BADGE.story

          return (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-600 transition-colors flex flex-col gap-4"
            >
              {article.coverImage && (
                <img
                  src={article.coverImage}
                  alt={title}
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}
              <div className="flex-1">
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold ${typeBadge.className}`}
                >
                  {typeBadge.label}
                </span>
                <h2 className="text-zinc-50 font-semibold text-base leading-snug mb-2 mt-1">
                  {title}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{date}</span>
                <span>·</span>
                <span>{getReadingTime(article)} min read</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
