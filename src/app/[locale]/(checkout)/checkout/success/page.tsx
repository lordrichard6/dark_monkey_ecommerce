import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { retrieveSession } from '@/lib/stripe'
import { SuccessContent } from './success-content'
import { XCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkout')
  return {
    title: t('orderConfirmedTitle'),
    description: t('thankYouDescription'),
  }
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  const t = await getTranslations('checkout')

  if (!session_id) {
    notFound()
  }

  // 1. Double check Stripe session status
  const session = await retrieveSession(session_id)

  if (!session || (session.status !== 'complete' && session.status !== 'open')) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-900/50">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-zinc-50">
            {t('paymentError')}
          </h1>
          <p className="mb-8 text-zinc-400">
            {t('paymentErrorMessage')}
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Contact Support
          </Link>
        </div>
      </div>
    )
  }

  // 2. Check if order already exists in our DB
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, total_cents, status')
    .eq('stripe_session_id', session_id)
    .maybeSingle()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <SuccessContent
        sessionId={session_id}
        initialOrder={order ? { id: order.id, status: order.status } : null}
      />
    </div>
  )
}
