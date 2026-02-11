import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy')
  return {
    title: t('title'),
    description: t('description'),
  }
}

// ISR: Revalidate static policy pages every 24 hours
export const revalidate = 86400

export default async function PrivacyPage() {
  const t = await getTranslations('privacy')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('privacyPolicy')}>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('cookiesWeUse')}</h2>
        <p className="mb-4 leading-relaxed">{t('cookiesIntro')}</p>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong className="text-zinc-200">{t('cartCookie')}</strong> — {t('cartCookieDesc')}
          </li>
          <li>
            <strong className="text-zinc-200">{t('authCookies')}</strong> — {t('authCookiesDesc')}
          </li>
          <li>
            <strong className="text-zinc-200">{t('consentCookie')}</strong> — {t('consentCookieDesc')}
          </li>
        </ul>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('dataWeCollect')}</h2>
        <p className="leading-relaxed">{t('dataIntro')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('yourRights')}</h2>
        <p className="leading-relaxed">{t('rightsIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
