import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export const metadata: Metadata = {
  title: 'Order confirmed',
  description: 'Thank you for your order',
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  if (!session_id) {
    notFound()
  }

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, total_cents, status')
    .eq('stripe_session_id', session_id)
    .single()

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-zinc-50">
          Order confirmed
        </h1>
        <p className="mb-8 text-zinc-400">
          Thank you for your order.
          {order ? (
            <>
              {' '}Order #{order.id.slice(0, 8)}.
              {order.status === 'paid' && ' Payment received.'}
            </>
          ) : (
            ' Your order is being processed.'
          )}
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
