import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ContactPage() {
  const t = await getTranslations('contact')
  const tFooter = await getTranslations('footer')
  return (
    <PolicyPageLayout title={tFooter('contactInfo')}>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">{t('getInTouch')}</h2>
        <p className="mb-4 leading-relaxed">{t('intro')}</p>
        <p className="mb-4">
          <strong className="text-zinc-200">{t('emailLabel')}</strong>{' '}
          <a
            href="mailto:support@dark-monkey.ch"
            className="text-amber-400 hover:text-amber-300"
          >
            support@dark-monkey.ch
          </a>
        </p>
        <p className="leading-relaxed">{t('refundsIntro')}</p>
      </section>
    </PolicyPageLayout>
  )
}
