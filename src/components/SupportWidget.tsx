'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X, MessageCircle, FileText, Mail, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function SupportWidget() {
    const t = useTranslations('footer')
    const [isOpen, setIsOpen] = useState(false)
    const widgetRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="fixed bottom-8 left-8 z-40" ref={widgetRef}>
            {/* Popover */}
            {isOpen && (
                <div className="absolute bottom-14 left-0 w-72 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2zl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="border-b border-white/5 bg-white/5 p-4">
                        <h3 className="font-bold text-white">{t('customerService')}</h3>
                        <p className="mt-1 text-xs text-zinc-400">
                            {t('supportDescription') || "We're here to help you with anything."}
                        </p>
                    </div>

                    <div className="p-2">
                        <Link
                            href="/faq"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{t('visitFaq') || 'Visit FAQ'}</span>
                                <span className="text-[10px] text-zinc-500">Instant answers to common questions</span>
                            </div>
                        </Link>

                        <a
                            href="mailto:support@dark-monkey.ch"
                            className="flex items-center gap-3 rounded-xl p-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{t('email') || 'Email Us'}</span>
                                <span className="text-[10px] text-zinc-500">support@dark-monkey.ch</span>
                            </div>
                        </a>

                        <div className="mt-2 border-t border-white/5 p-3">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
                                <Clock className="h-3 w-3" />
                                <span>{t('operatingHours')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${isOpen
                        ? 'bg-zinc-800 text-white rotate-90'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                aria-label="Support Support"
            >
                {isOpen ? <X className="h-6 h-6" /> : <HelpCircle className="h-6 h-6" />}
            </button>
        </div>
    )
}
