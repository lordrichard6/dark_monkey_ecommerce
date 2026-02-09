'use client'

import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Tag as TagIcon } from 'lucide-react'

type Tag = {
    id: string
    name: string
    slug: string
}

type TagFilterProps = {
    tags: Tag[]
    selectedTag?: string
}

export function TagFilter({ tags, selectedTag }: TagFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleTagClick(slug: string | null) {
        const params = new URLSearchParams(searchParams.toString())
        if (!slug) {
            params.delete('tag')
        } else {
            params.set('tag', slug)
        }
        router.push(`?${params.toString()}`, { scroll: false })
    }

    if (tags.length === 0) return null

    return (
        <div className="mb-8 flex flex-wrap gap-2 items-center">
            <button
                onClick={() => handleTagClick(null)}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${!selectedTag
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
            >
                All Products
            </button>

            {tags.map((tag) => (
                <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.slug)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selectedTag === tag.slug
                            ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                >
                    <TagIcon className="h-3.5 w-3.5" />
                    {tag.name}
                </button>
            ))}
        </div>
    )
}
