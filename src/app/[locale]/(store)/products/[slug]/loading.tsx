export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-3 w-10 rounded bg-zinc-800" />
        <div className="h-3 w-3 rounded bg-zinc-800" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
        <div className="h-3 w-3 rounded bg-zinc-800" />
        <div className="h-3 w-32 rounded bg-zinc-800" />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* LEFT: image skeleton */}
        <div className="flex flex-col gap-3">
          <div className="aspect-square w-full rounded-2xl bg-zinc-800 sm:aspect-[4/5]" />
          {/* Thumbnail row */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square w-12 shrink-0 rounded-lg bg-zinc-800" />
            ))}
          </div>
        </div>

        {/* RIGHT: info skeleton */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded-lg bg-zinc-800" />
            <div className="h-3 w-24 rounded bg-zinc-800" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-4 rounded bg-zinc-800" />
            ))}
            <div className="h-3 w-16 rounded bg-zinc-800" />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <div className="h-8 w-28 rounded-lg bg-zinc-800" />
            <div className="h-3 w-16 rounded bg-zinc-800" />
          </div>

          {/* Color swatches */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-zinc-800" />
            ))}
          </div>

          {/* Size buttons */}
          <div className="flex flex-wrap gap-2">
            {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
              <div key={s} className="h-10 w-12 rounded-lg bg-zinc-800" />
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded-xl bg-zinc-800" />
            <div className="h-12 rounded-xl bg-zinc-800" />
          </div>

          {/* Trust badges */}
          <div className="flex gap-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-20 rounded-lg bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
