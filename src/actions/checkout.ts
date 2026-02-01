'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCart, getCartCookieConfig, serializeCart } from '@/lib/cart'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import type { CartItem } from '@/types/cart'

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: 'STRIPE_NOT_CONFIGURED' }
  | { ok: false; error: 'CART_EMPTY' }
  | { ok: false; error: 'VALIDATION_FAILED'; message: string }
  | { ok: false; error: string }

export type GuestCheckoutInput = {
  email: string
  fullName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone?: string
}

export async function createCheckoutSession(
  input?: GuestCheckoutInput
): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: 'STRIPE_NOT_CONFIGURED' }
  }

  const cart = await getCart()
  if (cart.items.length === 0) {
    return { ok: false, error: 'CART_EMPTY' }
  }

  const supabase = await createClient()

  // Validate cart: prices, stock
  const validatedItems: { item: CartItem; priceCents: number; stock: number }[] =
    []

  for (const item of cart.items) {
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('id, price_cents, product_id')
      .eq('id', item.variantId)
      .single()

    if (variantError || !variant) {
      return {
        ok: false,
        error: 'VALIDATION_FAILED',
        message: `Product "${item.productName}" is no longer available`,
      }
    }

    if (item.priceCents < variant.price_cents) {
      return {
        ok: false,
        error: 'VALIDATION_FAILED',
        message: `Invalid price for "${item.productName}". Please refresh your cart.`,
      }
    }

    const { data: inventory } = await supabase
      .from('product_inventory')
      .select('quantity')
      .eq('variant_id', item.variantId)
      .single()

    const stock = inventory?.quantity ?? 0
    if (item.quantity > stock) {
      return {
        ok: false,
        error: 'VALIDATION_FAILED',
        message: `Insufficient stock for "${item.productName}" (max ${stock})`,
      }
    }

    validatedItems.push({
      item,
      priceCents: item.priceCents,
      stock,
    })
  }

  const stripe = getStripe()
  if (!stripe) {
    return { ok: false, error: 'STRIPE_NOT_CONFIGURED' }
  }

  const totalCents = validatedItems.reduce(
    (s, { item, priceCents }) => s + priceCents * item.quantity,
    0
  )

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const imageUrl = (url: string) =>
    url?.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`

  const lineItems = validatedItems.map(({ item, priceCents }) => {
    const desc = item.config && Object.keys(item.config).length > 0
      ? [item.variantName, 'Custom: ' + Object.entries(item.config).map(([k, v]) => `${k}: ${v}`).join(', ')].filter(Boolean).join(' · ')
      : item.variantName
    return {
      price_data: {
        currency: 'chf',
        product_data: {
          name: item.productName,
          description: desc ?? undefined,
          images: item.imageUrl ? [imageUrl(item.imageUrl)] : undefined,
        },
        unit_amount: priceCents,
      },
      quantity: item.quantity,
    }
  })
  const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/checkout`

  const metadata: Record<string, string> = {
    cartItems: JSON.stringify(
      validatedItems.map(({ item }) => ({
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
        priceCents: item.priceCents,
        config: item.config ?? {},
      }))
    ),
    totalCents: String(totalCents),
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id) metadata.user_id = user.id

  if (input?.email) {
    metadata.guest_email = input.email
    if (input.fullName) metadata.guest_name = input.fullName
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: input?.email ?? undefined,
    shipping_address_collection: { allowed_countries: ['CH', 'PT', 'ES', 'FR', 'DE', 'GB', 'US'] as const },
    metadata,
  })

  if (session.url) {
    // Clear cart on successful redirect
    const cookieStore = await cookies()
    const config = getCartCookieConfig()
    cookieStore.set(config.name, serializeCart({ items: [] }), {
      maxAge: config.maxAge,
      path: config.path,
      sameSite: config.sameSite,
      secure: config.secure,
    })
    return { ok: true, url: session.url }
  }

  return { ok: false, error: 'Failed to create checkout session' }
}
