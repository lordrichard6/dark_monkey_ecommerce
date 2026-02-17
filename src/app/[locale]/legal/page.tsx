import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  const title = t('title')
  const description = t('description')
  return {
    title,
    description,
    openGraph: { type: 'website', title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

// ISR: Revalidate static policy pages every 24 hours
export const revalidate = 86400

export default async function LegalPage() {
  const t = await getTranslations('legal')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('legalNotice')}>
      {/* § 1 — Company information (required by Swiss OR / DSG) */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('publisherTitle')}</h2>
        <address className="not-italic leading-relaxed space-y-1">
          <p className="font-semibold text-zinc-100">{t('companyName')}</p>
          <p>{t('companyAddress')}</p>
          <p>{t('companyCity')}</p>
          <p>{t('companyCountry')}</p>
        </address>
      </section>

      {/* § 2 — Registration & UID */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('registrationTitle')}</h2>
        <dl className="space-y-2">
          <div className="flex gap-2">
            <dt className="text-zinc-400 min-w-[140px]">{t('uidLabel')}</dt>
            <dd>{t('uidValue')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400 min-w-[140px]">{t('legalFormLabel')}</dt>
            <dd>{t('legalFormValue')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400 min-w-[140px]">{t('registeredLabel')}</dt>
            <dd>{t('registeredValue')}</dd>
          </div>
        </dl>
      </section>

      {/* § 3 — Contact */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('contactTitle')}</h2>
        <dl className="space-y-2">
          <div className="flex gap-2">
            <dt className="text-zinc-400 min-w-[140px]">{t('emailLabel')}</dt>
            <dd>
              <a href="mailto:support@dark-monkey.ch" className="text-green-400 hover:underline">
                support@dark-monkey.ch
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400 min-w-[140px]">{t('responsibleLabel')}</dt>
            <dd>{t('responsibleValue')}</dd>
          </div>
        </dl>
      </section>

      {/* § 4 — Dispute resolution (EU ODR / Swiss conciliation) */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('disputeTitle')}</h2>
        <p className="leading-relaxed">{t('disputeIntro')}</p>
      </section>

      {/* § 5 — Disclaimer */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('disclaimerTitle')}</h2>
        <p className="leading-relaxed">{t('disclaimerIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
