import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCart } from '@/lib/cart'
import { isStripeConfigured } from '@/lib/stripe'
import { CheckoutForm } from './checkout-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order',
}

export default async function CheckoutPage() {
  const cart = await getCart()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const stripeConfigured = isStripeConfigured()

  if (cart.items.length === 0) {
    redirect('/')
  }

  // Enrich cart with current prices for display
  const itemsWithDetails = await Promise.all(
    cart.items.map(async (item) => {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('price_cents')
        .eq('id', item.variantId)
        .single()
      const priceCents = variant?.price_cents ?? item.priceCents
      return { ...item, priceCents }
    })
  )

  const totalCents = itemsWithDetails.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0
  )

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-zinc-50">Checkout</h1>

        {!stripeConfigured && (
          <div className="mb-8 rounded-lg border border-amber-800 bg-amber-950/50 p-4 text-amber-200">
            <p className="font-medium">Stripe not configured</p>
            <p className="mt-2 text-sm text-amber-300/90">
              Add <code className="rounded bg-amber-900/50 px-1">STRIPE_SECRET_KEY</code> and{' '}
              <code className="rounded bg-amber-900/50 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{' '}
              <code className="rounded bg-amber-900/50 px-1">.env.local</code> to enable payments.
            </p>
          </div>
        )}

        <CheckoutForm
          items={itemsWithDetails}
          totalCents={totalCents}
          defaultEmail={user?.email ?? undefined}
          stripeConfigured={stripeConfigured}
        />
      </div>
    </div>
  )
}
