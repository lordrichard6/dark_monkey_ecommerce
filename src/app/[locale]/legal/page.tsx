import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function LegalPage() {
  const t = await getTranslations('legal')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('legalNotice')}>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('publisherTitle')}</h2>
        <p className="mb-4 leading-relaxed">{t('publisherIntro')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('disclaimerTitle')}</h2>
        <p className="leading-relaxed">{t('disclaimerIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
