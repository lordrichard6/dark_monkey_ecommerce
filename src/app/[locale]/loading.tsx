/**
 * Homepage / locale-root loading skeleton.
 *
 * Lets the layout shell (header, announcement bar, footer) paint immediately
 * while the page-level data (hero picks, featured products, categories, feed)
 * is still being fetched on the server. Without this, an ISR cache miss made
 * the user wait for every server fetch before any HTML streamed.
 *
 * The skeleton mirrors the lookbook hero shape so the perceived layout shift
 * when real content lands is minimal.
 */
export default function HomeLoading() {
  return (
    <div aria-hidden className="animate-pulse">
      {/* Hero shell — narrative left, 2 lookbook tiles right */}
      <section
        className="relative overflow-hidden bg-zinc-950"
        style={{ minHeight: 'calc(92dvh - var(--ann-bar-h, 0rem))' }}
      >
        <div className="mx-auto flex min-h-[inherit] max-w-7xl flex-col gap-8 px-4 pb-12 pt-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-20 lg:pt-12">
          {/* Narrative skeleton */}
          <div className="space-y-4 lg:col-span-5">
            <div className="h-6 w-32 rounded-full bg-zinc-900" />
            <div className="h-5 w-44 rounded-full bg-zinc-900/70" />
            <div className="space-y-3">
              <div className="h-12 w-3/4 rounded-lg bg-zinc-900" />
              <div className="h-12 w-2/3 rounded-lg bg-zinc-900" />
            </div>
            <div className="h-4 w-full max-w-md rounded bg-zinc-900/60" />
            <div className="h-4 w-5/6 max-w-md rounded bg-zinc-900/60" />
            <div className="flex gap-3 pt-2">
              <div className="h-11 w-44 rounded-full bg-zinc-900" />
              <div className="h-11 w-40 rounded-full bg-zinc-900/70" />
            </div>
          </div>

          {/* Lookbook tiles skeleton */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-3xl border border-white/[0.06] bg-zinc-900"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Generic section placeholders — keeps perceived layout stable */}
      {[0, 1].map((i) => (
        <div key={i} className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 h-6 w-48 rounded bg-zinc-900" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="aspect-[4/5] rounded-2xl bg-zinc-900" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
