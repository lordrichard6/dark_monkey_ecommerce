import { getTranslations } from 'next-intl/server'

const CUSTOM_EMAIL = 'support@dark-monkey.ch'

function MailtoLink({ subject, body }: { subject: string; body: string }) {
  const href = `mailto:${CUSTOM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return href
}

export async function CustomDesignSection() {
  const t = await getTranslations('home')

  const steps = [
    {
      number: '01',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
      title: t('customStep1Title'),
      desc: t('customStep1Desc'),
    },
    {
      number: '02',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      ),
      title: t('customStep2Title'),
      desc: t('customStep2Desc'),
    },
    {
      number: '03',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.091ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      ),
      title: t('customStep3Title'),
      desc: t('customStep3Desc'),
    },
  ]

  const mailtoHref = MailtoLink({
    subject: t('customEmailSubject'),
    body: t('customEmailBody'),
  })

  return (
    <section className="relative overflow-hidden bg-zinc-900 py-24">
      {/* Geometric accent lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute -right-20 top-0 h-full w-1/2 opacity-[0.03]" viewBox="0 0 600 800" fill="none" preserveAspectRatio="xMidYMid slice">
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

            <p className="mt-5 text-base leading-relaxed text-zinc-400">
              {t('customSubtitle')}
            </p>

            <a
              href={mailtoHref}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-amber-500 px-7 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 hover:shadow-amber-400/30 active:scale-95"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              {t('customCta')}
            </a>

            <p className="mt-3 text-xs text-zinc-600">
              {CUSTOM_EMAIL}
            </p>
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
