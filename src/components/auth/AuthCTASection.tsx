'use client'

import Link from 'next/link'
import { ArrowRight, UserPlus, LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function AuthCTASection() {
    const t = useTranslations('common') // or specific namespace if available

    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-6xl px-4">
                <div className="relative overflow-hidden p-8 md:p-16 text-center">



                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                            Unlock <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">Exclusive</span> Benefits
                        </h2>

                        <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
                            Join our community to access special offers, track your orders easily, and be the first to know about new drops.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link
                                href="/login?mode=signup"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 font-bold hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <UserPlus className="w-4 h-4" />
                                Create Account
                            </Link>

                            <Link
                                href="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-zinc-950 font-bold hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95"
                            >
                                <LogIn className="w-4 h-4" />
                                Log In
                            </Link>
                        </div>

                        <p className="text-xs text-zinc-500 pt-4">
                            Already have an account? Log in to view your points.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
