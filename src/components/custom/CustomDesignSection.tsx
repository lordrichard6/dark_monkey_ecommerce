import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getUserSafe } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function CustomDesignSection() {
  const t = await getTranslations('home')
  const supabase = await createClient()
  const user = await getUserSafe(supabase)
  const ctaHref = user ? '/account/customize' : '/signup?redirectTo=/account/customize'

  const steps = [
    {
      number: '01',
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      ),
      title: t('customStep1Title'),
      desc: t('customStep1Desc'),
    },
    {
      number: '02',
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
          />
        </svg>
      ),
      title: t('customStep2Title'),
      desc: t('customStep2Desc'),
    },
    {
      number: '03',
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      title: t('customStep3Title'),
      desc: t('customStep3Desc'),
    },
  ]

  return (
    <section className="relative overflow-hidden bg-zinc-900 py-24">
      {/* Geometric accent lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-20 top-0 h-full w-1/2 opacity-[0.03]"
          viewBox="0 0 600 800"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="600" y1="0" x2="0" y2="800" stroke="white" strokeWidth="1" />
          <line x1="500" y1="0" x2="0" y2="640" stroke="white" strokeWidth="1" />
          <line x1="400" y1="0" x2="0" y2="480" stroke="white" strokeWidth="1" />
        </svg>
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/3 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              {t('customEyebrow')}
            </span>

            <h2 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl font-serif lowercase italic">
              {t('customTitle')}
            </h2>

            <p className="mt-5 text-base leading-relaxed text-zinc-400">{t('customSubtitle')}</p>

            <Link
              href={ctaHref}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-amber-500 px-7 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 hover:shadow-amber-400/30 active:scale-95"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                />
              </svg>
              {t('customCta')}
            </Link>
          </div>

          {/* Right — steps */}
          <div className="flex flex-col gap-5">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="group flex gap-5 rounded-2xl border border-white/5 bg-zinc-950/60 p-6 transition hover:border-amber-500/20 hover:bg-zinc-950/80"
              >
                {/* Number + icon column */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 transition group-hover:bg-amber-500/15">
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-amber-500/20 to-transparent" />
                  )}
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-amber-500/60 uppercase">
                      {step.number}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-100">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
