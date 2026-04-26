import { getCachedUser } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight, BellRing, Sparkles, Heart } from 'lucide-react'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

/**
 * Auth CTA — value-exchange strip.
 *
 * Old: a 700px double-bezel ambient-glow card with generic "Welcome / Sign in"
 * messaging that competed with the rest of the page for attention. The Header
 * already has account links, so a giant card was redundant.
 *
 * New: an inline strip with three concrete member perks (early drops, wishlist
 * sync, custom design access). Hidden entirely for logged-in users — they're
 * already in, so showing them another "join" card was wasted screen.
 */
export async function AuthCTASection() {
  const t = await getTranslations('common')
  // Cached across the request — coalesces with FeedSection / CustomDesignSection
  const user = await getCachedUser()
  if (user) return null

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      {/* Soft amber glow — narrower than the old version, doesn't compete */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[100px]"
        aria-hidden
      />

      <div className="mx-auto max-w-5xl px-4">
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-6 backdrop-blur-sm md:p-8">
            <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-10">
              {/* Left: heading + perks */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  {t('authMembersEyebrow')}
                </span>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {t('authStripTitle')}
                </h2>

                {/* Perks — three concrete reasons, not generic vibes */}
                <ul className="mt-5 grid gap-2.5 text-sm text-zinc-300 sm:grid-cols-3 sm:gap-4">
                  <li className="inline-flex items-center gap-2">
                    <BellRing className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>{t('authPerkEarlyDrops')}</span>
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Heart className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>{t('authPerkWishlistSync')}</span>
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>{t('authPerkCustomDesign')}</span>
                  </li>
                </ul>
              </div>

              {/* Right: CTAs */}
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/signup"
                  aria-label={t('createAccount')}
                  className="group flex items-center justify-between gap-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-2 pl-6 pr-2 text-sm font-bold text-zinc-950 shadow-[0_0_30px_rgba(251,191,36,0.18)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_55px_rgba(251,191,36,0.35)] active:scale-[0.97]"
                >
                  <span>{t('createAccount')}</span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
                <Link
                  href="/login"
                  className="text-center text-xs text-zinc-500 transition-colors hover:text-amber-400"
                >
                  {t('alreadyHaveAccount')}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
