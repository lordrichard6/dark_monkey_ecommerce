'use client'

export function ProductGridSkeleton() {
    return (
        <section>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
                <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-800" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="group relative flex flex-col overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                        {/* Image Skeleton */}
                        <div className="aspect-[4/5] w-full animate-pulse bg-zinc-800" />

                        {/* Content Skeleton */}
                        <div className="flex flex-1 flex-col p-4 space-y-3">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
                            <div className="flex items-center justify-between pt-2">
                                <div className="h-6 w-20 animate-pulse rounded bg-zinc-800" />
                                <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
