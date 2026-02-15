'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    if (!isVisible) return null

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[40] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-950/80 text-zinc-400 backdrop-blur-md transition-all hover:bg-zinc-900 hover:text-white hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300"
            aria-label="Back to top"
        >
            <ArrowUp className="h-5 w-5" />
        </button>
    )
}
