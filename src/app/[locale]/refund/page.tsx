import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('refund')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function RefundPage() {
  const t = await getTranslations('refund')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('refundPolicy')}>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('returnsRefundsTitle')}</h2>
        <p className="mb-4 leading-relaxed">{t('returnsIntro')}</p>
        <p className="leading-relaxed">{t('refundsProcessed')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('exclusionsTitle')}</h2>
        <p className="leading-relaxed">{t('exclusionsIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
