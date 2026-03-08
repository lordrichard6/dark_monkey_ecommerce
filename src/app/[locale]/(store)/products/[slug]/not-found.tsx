import Link from 'next/link'
import { PackageSearch } from 'lucide-react'

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60">
        <PackageSearch className="h-8 w-8 text-zinc-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Product not found</h2>
      <p className="mb-8 max-w-sm text-zinc-400">
        This product doesn&apos;t exist or is no longer available. Browse our collection to find
        something you&apos;ll love.
      </p>
      <Link
        href="/"
        className="rounded-full bg-amber-500 px-6 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-400"
      >
        Back to shop
      </Link>
    </div>
  )
}
