import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight, UserPlus, LogIn, LayoutDashboard } from 'lucide-react'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

// ---------------------------------------------------------------------------
// Shared layout — double-bezel card wrapping both variants
// ---------------------------------------------------------------------------

function CTAShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Ambient amber glow — centred behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/6 blur-[160px]" />
      <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 rounded-full bg-amber-600/4 blur-[100px]" />

      <div className="mx-auto max-w-4xl px-4">
        <ScrollReveal>
          {/* ── Outer shell (double-bezel) ── */}
          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-2 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
            {/* ── Inner core ── */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 px-8 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)] md:px-16 md:py-20">
              {/* Top amber arc glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[70px]" />
              {/* Subtle grid texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right,#ffffff12 1px,transparent 1px),linear-gradient(to bottom,#ffffff12 1px,transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
                aria-hidden
              />
              <div className="relative z-10">{children}</div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Shared pill button — button-in-button pattern, rounded-full
// ---------------------------------------------------------------------------

function PillLink({
  href,
  variant,
  label,
  icon: Icon,
}: {
  href: string
  variant: 'primary' | 'secondary'
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  if (variant === 'primary') {
    return (
      <Link
        href={href as '/'}
        aria-label={label}
        className="group flex w-full items-center justify-between rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-2 pl-7 pr-2 font-bold text-zinc-950 shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_55px_rgba(251,191,36,0.4)] active:scale-[0.97] sm:w-auto"
      >
        <span className="pr-4">{label}</span>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <Icon className="h-4 w-4" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href as '/'}
      aria-label={label}
      className="group flex w-full items-center justify-between rounded-full border border-white/15 bg-white/5 py-2 pl-7 pr-2 font-bold text-zinc-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/30 hover:bg-white/10 active:scale-[0.97] sm:w-auto"
    >
      <span className="pr-4">{label}</span>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        <Icon className="h-4 w-4" />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function AuthCTASection() {
  const t = await getTranslations('common')
  const supabase = await createClient()

  let isLoggedIn = false
  try {
    const { data } = await supabase.auth.getUser()
    isLoggedIn = !!data.user
  } catch {
    // treat as logged out on error
  }

  if (isLoggedIn) {
    return (
      <CTAShell>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Eyebrow */}
          <div className="flex justify-center">
            <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Members Club
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            {t.rich('authLoggedInTitle', {
              secondary: (chunks) => (
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {chunks}
                </span>
              ),
            })}
          </h2>

          <p className="text-lg leading-relaxed text-zinc-400 md:text-xl">
            {t('authLoggedInSubtitle')}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
            <PillLink
              href="/account"
              variant="primary"
              label={t('goToAccount')}
              icon={LayoutDashboard}
            />
            <PillLink
              href="/categories"
              variant="secondary"
              label={t('shopCollection')}
              icon={ArrowRight}
            />
          </div>
        </div>
      </CTAShell>
    )
  }

  return (
    <CTAShell>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Eyebrow */}
        <div className="flex justify-center">
          <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
            Join the Community
          </span>
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          {t.rich('authTitle', {
            secondary: (chunks) => (
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                {chunks}
              </span>
            ),
          })}
        </h2>

        <p className="text-lg leading-relaxed text-zinc-400 md:text-xl">{t('authSubtitle')}</p>

        <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
          <PillLink href="/signup" variant="primary" label={t('createAccount')} icon={UserPlus} />
          <PillLink href="/login" variant="secondary" label={t('logIn')} icon={LogIn} />
        </div>

        <p className="pt-4 text-xs text-zinc-500">{t('alreadyHaveAccount')}</p>
      </div>
    </CTAShell>
  )
}
