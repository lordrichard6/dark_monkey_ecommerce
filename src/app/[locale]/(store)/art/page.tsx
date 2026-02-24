import { getGalleryItems, getTags } from '@/actions/gallery'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Palette } from 'lucide-react'

// ISR: Revalidate art gallery every 5 minutes (frequently updated with votes)
export const revalidate = 300

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations('art')
  const { tag } = await searchParams
  const title = tag ? `${t('titleWithTag', { tag })} — DarkMonkey` : `${t('title')} — DarkMonkey`
  return {
    title,
    description: t('description'),
  }
}

const PAGE_SIZE = 20

export default async function ArtGalleryPage({ searchParams }: Props) {
  const { tag, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const t = await getTranslations('art')
  const tags = await getTags()
  const { items, total } = await getGalleryItems(PAGE_SIZE, offset, tag)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const activeTag = tags.find((t) => t.slug === tag)

  return (
    <div className="relative min-h-screen">
      {/* Ambient background orbs — matches the site's visual language */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="gradient-orb gradient-orb-orange-1" style={{ opacity: 0.25 }} />
        <div className="gradient-orb gradient-orb-purple-1" style={{ opacity: 0.15 }} />
      </div>

      {/* ── Hero Banner ──
                Negative margins cancel the px-4 (mobile) and the md:pl-16 side-nav offset
                that the store layout injects into <main>. This makes the hero full-bleed. */}
      <div className="relative -mx-4 -mt-14 border-b border-white/5 bg-zinc-950/60 backdrop-blur-sm md:-ml-20">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-24 md:pb-14 md:pt-28">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Left — title + description */}
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-amber-400 uppercase">
                <Palette className="h-3.5 w-3.5" />
                {t('title')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                {activeTag ? activeTag.name : t('heading')}
              </h1>
              <p className="mt-3 text-base text-zinc-400 md:text-lg">{t('subheading')}</p>
              {total > 0 && (
                <p className="mt-2 text-sm text-zinc-600">
                  {total} {total === 1 ? 'piece' : 'pieces'}
                  {activeTag ? ` in ${activeTag.name}` : ' in the collection'}
                </p>
              )}
            </div>

            {/* Right — stats chips */}
            <div className="flex gap-3 flex-shrink-0">
              <div className="rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-400">{tags.length}</div>
                <div className="text-xs text-zinc-500 mt-0.5">Categories</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{total}</div>
                <div className="text-xs text-zinc-500 mt-0.5">Art Pieces</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tag Filter Bar ── */}
      <div className="-mx-4 sticky top-14 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md md:-ml-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            <Link
              href="/art"
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                !tag
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-white'
              }`}
            >
              {t('allArt')}
            </Link>
            {tags.map((tagItem) => (
              <Link
                key={tagItem.id}
                href={`/art?tag=${tagItem.slug}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  tag === tagItem.slug
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-white'
                }`}
              >
                {tagItem.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <GalleryGrid
          initialItems={items}
          initialTotal={total}
          initialPage={page}
          tag={tag}
          pageSize={PAGE_SIZE}
        />

        {/* Server-rendered pagination fallback (SEO) */}
        {totalPages > 1 && (
          <nav aria-label={t('pagination')} className="mt-12 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={tag ? `/art?tag=${tag}&page=${page - 1}` : `/art?page=${page - 1}`}
                className="rounded-full bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
              >
                ← {t('prev')}
              </Link>
            )}
            <span className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-zinc-500">
              {t('pageOf', { page, total: totalPages })}
            </span>
            {page < totalPages && (
              <Link
                href={tag ? `/art?tag=${tag}&page=${page + 1}` : `/art?page=${page + 1}`}
                className="rounded-full bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
              >
                {t('next')} →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
