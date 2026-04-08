import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

const INSTAGRAM_URL = 'https://www.instagram.com/dark_monkey_store/'
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61574367719121'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export async function SocialSection() {
  const t = await getTranslations('home')

  const platforms = [
    {
      name: 'Instagram',
      handle: '@dark_monkey_store',
      url: INSTAGRAM_URL,
      Icon: InstagramIcon,
      gradient: 'from-purple-600 via-pink-600 to-orange-500',
      glow: 'rgba(236,72,153,0.12)',
      outerBorder: 'border-pink-500/15',
      innerBorder: 'border-pink-500/8',
      buttonBg:
        'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-500 hover:via-pink-400 hover:to-orange-400',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      iconRing: 'ring-pink-500/20',
    },
    {
      name: 'Facebook',
      handle: 'Dark Monkey Store',
      url: FACEBOOK_URL,
      Icon: FacebookIcon,
      gradient: 'from-blue-700 to-blue-500',
      glow: 'rgba(59,130,246,0.12)',
      outerBorder: 'border-blue-500/15',
      innerBorder: 'border-blue-500/8',
      buttonBg: 'bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400',
      iconBg: 'bg-blue-500/10',
      iconRing: 'ring-blue-500/20',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 md:py-32">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-pink-600/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/5 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-14 text-center">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              {t('socialEyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl font-serif lowercase italic">
              {t('socialTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">{t('socialSubtitle')}</p>
          </div>
        </ScrollReveal>

        {/* Platform cards — double-bezel */}
        <div className="grid gap-6 sm:grid-cols-2">
          {platforms.map(
            (
              {
                name,
                handle,
                url,
                Icon,
                gradient,
                glow,
                outerBorder,
                innerBorder,
                buttonBg,
                iconBg,
                iconRing,
              },
              i
            ) => (
              <ScrollReveal key={name} delay={i * 0.1}>
                {/* Outer shell */}
                <div className={`rounded-[1.75rem] border ${outerBorder} bg-white/[0.02] p-1.5`}>
                  {/* Inner core */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex flex-col gap-6 overflow-hidden rounded-[1.375rem] border ${innerBorder} bg-zinc-900/70 p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-zinc-900/90 hover:-translate-y-0.5`}
                    style={{
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05), 0 0 40px ${glow}`,
                    }}
                  >
                    {/* Corner gradient wash */}
                    <div
                      className={`pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] blur-2xl transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-[0.16]`}
                    />

                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} ring-1 ${iconRing}`}
                      >
                        <Icon className="h-7 w-7 text-zinc-100" />
                      </div>
                      {/* Arrow hint — diagonal kinetic on hover */}
                      <svg
                        className="h-5 w-5 text-zinc-600 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-zinc-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 17L17 7M17 7H7M17 7v10"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-lg font-bold text-zinc-100">{name}</p>
                      <p className="mt-0.5 text-sm font-medium text-zinc-500">{handle}</p>
                    </div>

                    <div
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl ${buttonBg} px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]`}
                    >
                      <Icon className="h-4 w-4" />
                      {t('socialFollowButton', { platform: name })}
                    </div>
                  </a>
                </div>
              </ScrollReveal>
            )
          )}
        </div>

        {/* Perks strip */}
        <ScrollReveal delay={0.2}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-zinc-500">
            {[t('socialPerk1'), t('socialPerk2'), t('socialPerk3')].map((perk) => (
              <span key={perk} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                {perk}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
