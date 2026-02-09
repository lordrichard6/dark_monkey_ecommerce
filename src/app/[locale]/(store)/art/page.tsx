import { getGalleryItems, getTags } from '@/actions/gallery'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Link } from '@/i18n/navigation'

export const metadata = {
    title: 'Art Gallery | Lopes2Tech',
    description: 'Browse our exclusive art collection and vote for your favorites.',
}

export default async function ArtGalleryPage({
    searchParams
}: {
    searchParams: Promise<{ tag?: string }>
}) {
    const { tag } = await searchParams
    const tags = await getTags()
    const { items } = await getGalleryItems(50, 0, tag)

    return (
        <div className="container mx-auto px-4 py-8 mt-16 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Art Gallery</h1>
                    <p className="text-zinc-400">Vote for your favorite designs to be featured in our next collection.</p>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                    <Link
                        href="/art"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${!tag ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        All Art
                    </Link>
                    {tags.map(t => (
                        <Link
                            key={t.id}
                            href={`/art?tag=${t.slug}`}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${tag === t.slug ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {t.name}
                        </Link>
                    ))}
                </div>
            </div>

            <GalleryGrid initialItems={items} />
        </div>
    )
}
