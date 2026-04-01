import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export function Lopes2TechSection() {
  return (
    <section className="relative">
      {/* Top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Left: brand */}
          <a
            href="https://www.lopes2tech.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 opacity-50 transition-opacity duration-300 hover:opacity-100"
          >
            <Image
              src="/images/lopes2tech_logo.png"
              alt="Lopes2Tech"
              width={28}
              height={28}
              className="rounded-md grayscale transition-all duration-300 group-hover:grayscale-0"
            />
            <span className="text-sm font-semibold tracking-tight text-zinc-300">
              Lopes<span className="text-amber-400">2</span>Tech
            </span>
          </a>

          {/* Center: tagline */}
          <p className="text-xs text-zinc-600 text-center sm:text-left">
            Crafted by{' '}
            <span className="text-zinc-500">Lopes2Tech</span>
            {' '}— digital products for ambitious brands
          </p>

          {/* Right: CTA */}
          <a
            href="https://www.lopes2tech.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors duration-200 hover:text-amber-400"
          >
            Want a store like this?
            <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </section>
  )
}
