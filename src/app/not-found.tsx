import { Ghost } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Ghost className="w-20 h-20 mx-auto text-zinc-600" strokeWidth={1.5} />
        </div>

        <p className="text-green-500 text-sm font-semibold tracking-widest uppercase mb-2">
          404
        </p>

        <h1 className="text-3xl font-bold text-white mb-3">Page Not Found</h1>

        <p className="text-zinc-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition mb-6"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 flex justify-center gap-6 text-sm text-zinc-500">
          <Link href="/products" className="hover:text-green-400 transition">
            Shop
          </Link>
          <Link href="/categories" className="hover:text-green-400 transition">
            Categories
          </Link>
          <Link href="/contact" className="hover:text-green-400 transition">
            Contact
          </Link>
        </div>
      </div>
    </div>
  )
}
