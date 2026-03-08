import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PolicyPageLayout } from '@/components/PolicyPageLayout'
import { Link } from '@/i18n/navigation'

const SUPPORTED_LOCALES = ['en', 'pt', 'de', 'it', 'fr'] as const

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('contact')
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dark-monkey.ch').replace(/\/$/, '')
  const title = t('title')
  const description = t('description')
  const url = `${siteUrl}/${locale}/contact`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, `${siteUrl}/${loc}/contact`])
      ),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DarkMonkey',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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
          <a href="mailto:support@dark-monkey.ch" className="text-amber-400 hover:text-amber-300">
            support@dark-monkey.ch
          </a>
        </p>
        <p className="leading-relaxed">{t('refundsIntro')}</p>
      </section>

      <section className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h2 className="mb-2 text-lg font-semibold text-zinc-50">Support Tickets</h2>
        <p className="mb-4 text-sm text-zinc-400">
          For order issues, complaints, or suggestions — open a support ticket and track it in your
          account.
        </p>
        <Link
          href="/account/support/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          Open a Support Ticket
        </Link>
      </section>
    </PolicyPageLayout>
  )
}
