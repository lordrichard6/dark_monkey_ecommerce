'use client'

export function ProductCarouselSkeleton() {
    return (
        <section className="bg-zinc-950 py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-12">
                    <div className="w-full">
                        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-900" />
                        <div className="mt-6 flex gap-8 border-b border-white/5 pb-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-4 w-16 animate-pulse rounded bg-zinc-900" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[320px] flex-shrink-0 space-y-4">
                            <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-zinc-900" />
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-900" />
                                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-900" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
