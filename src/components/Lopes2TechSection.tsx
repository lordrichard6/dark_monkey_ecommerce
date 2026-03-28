import Image from 'next/image'
import { Monitor, TrendingUp, Cpu, ShoppingCart, ArrowRight } from 'lucide-react'

const services = [
  {
    icon: Monitor,
    title: 'Web Design',
    description: 'Premium websites that convert visitors into customers.',
  },
  {
    icon: TrendingUp,
    title: 'Meta & Google Ads',
    description: 'Data-driven ad campaigns that grow your revenue.',
  },
  {
    icon: Cpu,
    title: 'AI & Automation',
    description: 'Automate workflows and scale without hiring.',
  },
  {
    icon: ShoppingCart,
    title: 'E-Commerce',
    description: 'Full-stack stores built to sell — like this one.',
  },
]

export function Lopes2TechSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950" />

      {/* Subtle amber glow top-left */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      {/* Subtle blue glow bottom-right — nod to L2T brand */}
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Thin top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-14 flex flex-col items-center text-center gap-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
            Built by
          </span>

          <a
            href="https://www.lopes2tech.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Image
              src="/images/lopes2tech_logo.png"
              alt="Lopes2Tech"
              width={52}
              height={52}
              className="rounded-lg opacity-90"
            />
            <span className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
              Lopes<span className="text-amber-400">2</span>Tech
            </span>
          </a>

          <p className="max-w-xl text-base text-zinc-400 leading-relaxed">
            The agency behind Dark Monkey. We build high-performance digital products — websites,
            e-commerce stores, ad campaigns, and AI automations for ambitious brands.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:bg-zinc-900/70"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 transition-colors group-hover:bg-amber-500/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-zinc-100">{title}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="https://www.lopes2tech.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-7 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-zinc-800/80 hover:text-amber-400"
          >
            Want a store like this?
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Thin bottom border */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
    </section>
  )
}
