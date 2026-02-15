'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { Announcement } from '@/actions/announcements'

type Props = {
    announcements?: Announcement[]
}

export function AnnouncementBar({ announcements = [] }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    // Using "active" messages only. If backend passed all, we'd filter here, 
    // but the backend `getAnnouncements` already filters by active=true.
    // However, if no announcements, we hide.
    const hasAnnouncements = announcements.length > 0

    useEffect(() => {
        if (!hasAnnouncements) return
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [announcements.length, hasAnnouncements])

    if (!isVisible || !hasAnnouncements) return null

    return (
        <div className="relative z-50 bg-zinc-950 border-b border-white/5 py-2.5">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex flex-1 items-center justify-center">
                    <div className="relative h-5 w-full overflow-hidden">
                        {announcements.map((announcement, index) => (
                            <div
                                key={announcement.id}
                                className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ease-in-out ${index === currentIndex
                                    ? 'translate-y-0 opacity-100'
                                    : index < currentIndex
                                        ? '-translate-y-full opacity-0'
                                        : 'translate-y-full opacity-0'
                                    }`}
                            >
                                <Sparkles className="h-4 w-4 text-amber-400" />
                                {announcement.url ? (
                                    <a href={announcement.url} className="text-xs font-medium tracking-wide text-zinc-300 hover:text-white hover:underline sm:text-sm">
                                        {announcement.text}
                                    </a>
                                ) : (
                                    <span className="text-xs font-medium tracking-wide text-zinc-300 sm:text-sm">
                                        {announcement.text}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {announcements.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                                className="rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                                aria-label="Previous announcement"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                                className="rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                                aria-label="Next announcement"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="ml-2 rounded-full p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
