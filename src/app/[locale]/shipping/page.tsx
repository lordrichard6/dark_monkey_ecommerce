import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shipping')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ShippingPage() {
  const t = await getTranslations('shipping')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('shippingPolicy')}>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('deliveryRegionsTitle')}</h2>
        <p className="mb-4 leading-relaxed">{t('deliveryRegionsIntro')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('processingTimeTitle')}</h2>
        <p className="mb-4 leading-relaxed">{t('processingTimeIntro')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('deliveryTimesTitle')}</h2>
        <p className="leading-relaxed">{t('deliveryTimesIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
