'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { GalleryItem, voteForItem } from '@/actions/gallery'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
    initialItems: GalleryItem[]
}

export function GalleryGrid({ initialItems }: Props) {
    const [items, setItems] = useState(initialItems)
    const [fingerprint, setFingerprint] = useState<string | null>(null)
    const [votingId, setVotingId] = useState<string | null>(null)

    // Sync items when initialItems change (e.g. tag filter change)
    useEffect(() => {
        setItems(initialItems)
        // We need to re-apply local storage votes after items update? 
        // Yes, if we switch tags, we want to maintain "voted" state for guests.
        const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
        if (voted.length > 0) {
            setItems(current => current.map(item => ({
                ...item,
                has_voted: item.has_voted || voted.includes(item.id)
            })))
        }
    }, [initialItems])

    useEffect(() => {
        let fp = localStorage.getItem('gallery_fingerprint')
        if (!fp) {
            fp = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            localStorage.setItem('gallery_fingerprint', fp)
        }
        setFingerprint(fp)

        // Initial check for guest votes
        const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
        if (voted.length > 0) {
            setItems(current => current.map(item => ({
                ...item,
                has_voted: item.has_voted || voted.includes(item.id)
            })))
        }
    }, [])

    const handleVote = async (itemId: string) => {
        if (!fingerprint) return

        const itemIndex = items.findIndex(i => i.id === itemId)
        if (itemIndex === -1) return

        const item = items[itemIndex]
        if (item.has_voted) {
            toast.error("You've already voted for this piece!")
            return
        }

        // Optimistic update
        const originalItems = [...items]
        const newItems = [...items]
        newItems[itemIndex] = {
            ...item,
            votes_count: item.votes_count + 1,
            has_voted: true
        }
        setItems(newItems)
        setVotingId(itemId)

        // Save to local storage immediately for UI consistency
        const voted = JSON.parse(localStorage.getItem('gallery_voted_items') || '[]')
        if (!voted.includes(itemId)) {
            voted.push(itemId)
            localStorage.setItem('gallery_voted_items', JSON.stringify(voted))
        }

        const result = await voteForItem(itemId, fingerprint)
        setVotingId(null)

        if (!result.ok) {
            toast.error(result.error || "Failed to vote")
            setItems(originalItems) // Revert UI

            // Revert local storage
            const newVoted = voted.filter((id: string) => id !== itemId)
            localStorage.setItem('gallery_voted_items', JSON.stringify(newVoted))
        } else {
            toast.success("Vote recorded!")
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded-2xl bg-white/5">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No art found</h3>
                <p className="text-zinc-400 max-w-sm">
                    We couldn't find any art matching your criteria. Try selecting a different category.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
                <div key={item.id} className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-white/10 shadow-lg hover:border-amber-500/50 transition duration-300">
                    <div className="aspect-[4/5] relative overflow-hidden">
                        <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-110"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition" />

                        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition">
                            <h3 className="text-lg font-bold text-white leading-tight mb-1 truncate">{item.title}</h3>
                            {item.description && <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{item.description}</p>}

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex gap-1 flex-wrap">
                                    {item.tags.slice(0, 3).map(tag => (
                                        <span key={tag.id} className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/5">
                                            #{tag.name}
                                        </span>
                                    ))}
                                    {item.tags.length > 3 && (
                                        <span className="text-[10px] text-zinc-400 px-1">+{item.tags.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleVote(item.id)}
                            disabled={!!votingId || item.has_voted}
                            className={`absolute top-3 right-3 p-2.5 rounded-full transition-all shadow-xl backdrop-blur-sm z-10 ${item.has_voted
                                ? 'bg-amber-500 text-white scale-110 cursor-default'
                                : 'bg-black/40 text-white hover:bg-amber-500 hover:scale-110'
                                }`}
                            aria-label="Vote for this art"
                        >
                            <div className="flex flex-col items-center gap-0.5 leading-none">
                                <Heart className={`w-5 h-5 ${item.has_voted ? 'fill-current' : ''}`} />
                                <span className="text-[10px] font-bold">{item.votes_count}</span>
                            </div>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
