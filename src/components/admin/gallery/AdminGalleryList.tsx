'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GalleryItem, deleteGalleryItem } from '@/actions/gallery'
import { TrashIcon } from 'lucide-react'

type Props = {
    items: GalleryItem[]
}

export function AdminGalleryList({ items }: Props) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this item?')) return
        setLoadingId(id)
        const result = await deleteGalleryItem(id)
        setLoadingId(null)
        if (!result.ok) {
            alert(result.error)
        } else {
            router.refresh()
        }
    }

    if (items.length === 0) {
        return <div className="text-zinc-500 text-center py-12 border border-white/5 rounded-lg bg-white/5">No art uploaded yet.</div>
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-900 border border-white/10">
                    <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-110"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex flex-col justify-end p-4">
                        <h3 className="font-bold text-white text-sm truncate">{item.title}</h3>
                        {item.description && <p className="text-xs text-zinc-400 truncate">{item.description}</p>}
                        <div className="flex gap-1 mt-1 flex-wrap">
                            {item.tags.map(tag => (
                                <span key={tag.id} className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">{tag.name}</span>
                            ))}
                        </div>
                        <button
                            onClick={() => handleDelete(item.id)}
                            disabled={loadingId === item.id}
                            title="Delete"
                            className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition disabled:opacity-50"
                        >
                            {loadingId === item.id ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span>
                            ) : (
                                <TrashIcon className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
