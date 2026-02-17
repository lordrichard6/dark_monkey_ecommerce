import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms')
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function TermsPage() {
  const t = await getTranslations('terms')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('termsOfService')}>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('acceptanceTitle')}</h2>
        <p className="mb-4 leading-relaxed">{t('acceptanceIntro')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('useOfStoreTitle')}</h2>
        <p className="mb-4 leading-relaxed">{t('useOfStoreIntro')}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('ordersPaymentTitle')}</h2>
        <p className="leading-relaxed">{t('ordersPaymentIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
