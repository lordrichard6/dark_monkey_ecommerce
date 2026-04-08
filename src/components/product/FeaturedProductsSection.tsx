import { fetchHomeProducts } from '@/actions/products'
import { ProductGrid } from './ProductGrid'
import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export async function FeaturedProductsSection() {
  const [products, t] = await Promise.all([
    fetchHomeProducts({ featured: true, limit: 8 }),
    getTranslations('home'),
  ])

  if (products.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 md:py-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-4">
        {/* ── Section header — scroll reveal ── */}
        <ScrollReveal className="mb-12 md:mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
            {t('featuredEyebrow') || 'Hand-picked'}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl font-serif lowercase italic">
            {t('featuredProducts')}
          </h2>
        </ScrollReveal>

        {/* ── Grid — reveal slightly after the header ── */}
        <ScrollReveal delay={0.1}>
          <ProductGrid products={products} title={t('featuredProducts')} hideHeader={true} />
        </ScrollReveal>
      </div>
    </section>
  )
}
