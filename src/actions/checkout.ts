'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getCart, getCartCookieConfig, serializeCart } from '@/lib/cart'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import type { CartItem } from '@/types/cart'

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: 'STRIPE_NOT_CONFIGURED' }
  | { ok: false; error: 'CART_EMPTY' }
  | { ok: false; error: 'VALIDATION_FAILED'; message: string }
  | { ok: false; error: string }

import { SUPPORTED_CURRENCIES, SupportedCurrency, convertPrice } from '@/lib/currency'

export type GuestCheckoutInput = {
  email: string
  fullName?: string
  line1?: string
  line2?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  /** Discount code to apply (validated server-side) */
  discountCode?: string | null
  currency?: string
}

export type ValidateDiscountResult =
  | { ok: true; discountId: string; discountCents: number; code: string }
  | { ok: false; error: string }

/**
 * Validates a discount code against the `discounts` table and computes the discount amount.
 * Performs case-insensitive lookup and checks validity window, max uses, and minimum order value.
 *
 * @param code - Raw discount code entered by the user (trimmed + uppercased internally).
 * @param subtotalCents - Cart subtotal in cents (used to check `min_order_cents` threshold).
 * @returns On success: `{ ok: true, discountId, discountCents, code }`.
 *          On failure: `{ ok: false, error }` with a user-facing message.
 */
export async function validateDiscountCode(
  code: string,
  subtotalCents: number
): Promise<ValidateDiscountResult> {
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return { ok: false, error: 'Code is required' }

  const supabase = await createClient()
  const { data: discount, error } = await supabase
    .from('discounts')
    .select(
      'id, code, type, value_cents, min_order_cents, valid_from, valid_until, max_uses, use_count'
    )
    .ilike('code', trimmed)
    .single()

  if (error || !discount) return { ok: false, error: 'Invalid or expired code' }

  const now = new Date().toISOString()
  if (discount.valid_from > now) return { ok: false, error: 'Code not yet valid' }
  if (discount.valid_until && discount.valid_until < now)
    return { ok: false, error: 'Code has expired' }
  if (discount.max_uses != null && (discount.use_count ?? 0) >= discount.max_uses) {
    return { ok: false, error: 'Code has reached maximum uses' }
  }
  if ((discount.min_order_cents ?? 0) > subtotalCents) {
    return { ok: false, error: `Minimum order is ${(discount.min_order_cents ?? 0) / 100} CHF` }
  }

  let discountCents: number
  if (discount.type === 'percentage') {
    // value_cents stored as percentage * 100 (e.g. 1000 = 10%)
    discountCents = Math.round((subtotalCents * (discount.value_cents ?? 0)) / 10000)
  } else {
    discountCents = Math.min(discount.value_cents ?? 0, subtotalCents)
  }
  if (discountCents <= 0) return { ok: false, error: 'Invalid discount value' }

  return {
    ok: true,
    discountId: discount.id,
    discountCents,
    code: discount.code,
  }
}

function validateStripePayload(data: {
  name: string
  images: string[]
  unit_amount: number
  quantity: number
  description?: string
}) {
  // 1. Truncate strings to Stripe limits
  const name = data.name.substring(0, 500)
  const description = data.description?.substring(0, 1000)

  // 2. Validate Images (must be http/https and not empty)
  // Stripe allows max 8 images
  const validImages = data.images
    .filter((img) => img && (img.startsWith('http://') || img.startsWith('https://')))
    .slice(0, 8)

  // 3. Round amount to integer (cents)
  const unit_amount = Math.round(data.unit_amount)

  // 4. Ensure quantity is positive integer
  const quantity = Math.max(1, Math.round(data.quantity))

  return {
    name,
    description,
    images: validImages,
    unit_amount,
    quantity,
  }
}

/**
 * Creates a Stripe Checkout Session for the current cart.
 * Supports both authenticated users (pre-filled email) and guest checkout.
 * Applies currency conversion and optional discount codes server-side.
 * Clears the cart cookie after a successful session is created.
 *
 * @param input - Optional guest checkout data (email, address, discount code, currency).
 * @returns `{ ok: true, url }` with the Stripe-hosted checkout URL, or `{ ok: false, error }` on failure.
 *          Error codes: `STRIPE_NOT_CONFIGURED`, `CART_EMPTY`, `VALIDATION_FAILED`.
 */
export async function createCheckoutSession(input?: GuestCheckoutInput): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: 'STRIPE_NOT_CONFIGURED' }
  }

  const cart = await getCart()
  if (cart.items.length === 0) {
    return { ok: false, error: 'CART_EMPTY' }
  }

  const supabase = await createClient()

  const requestedCurrency =
    input?.currency &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SUPPORTED_CURRENCIES.includes(input.currency as any)
      ? (input.currency as SupportedCurrency)
      : 'CHF'

  // Validate cart: prices, stock
  const validatedItems: { item: CartItem; priceCents: number; stock: number }[] = []

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

  const subtotalCents = validatedItems.reduce(
    (s, { item, priceCents }) => s + priceCents * item.quantity,
    0
  )

  let discountId: string | null = null
  let discountCents = 0
  if (input?.discountCode?.trim()) {
    const result = await validateDiscountCode(input.discountCode.trim(), subtotalCents)
    if (result.ok) {
      discountId = result.discountId
      discountCents = result.discountCents
    }
  }
  const totalCents = Math.max(0, subtotalCents - discountCents)

  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    if (process.env.VERCEL_URL) return 'https://www.dark-monkey.ch'
    return 'http://localhost:3000'
  }
  const baseUrl = getBaseUrl()

  console.log('[Checkout] Debug: Base URL resolved to:', baseUrl)
  console.log('[Checkout] Debug: NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
  console.log('[Checkout] Debug: VERCEL_URL:', process.env.VERCEL_URL)

  const imageUrl = (url: string) =>
    url?.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`

  const lineItems: Array<{
    price_data: {
      currency: string
      product_data: { name: string; description?: string; images?: string[] }
      unit_amount: number
    }
    quantity: number
  }> = validatedItems.map(({ item, priceCents }) => {
    // Convert price to target currency
    const convertedPrice = convertPrice(priceCents, requestedCurrency)

    const desc =
      item.config && Object.keys(item.config).length > 0
        ? [
            item.variantName,
            'Custom: ' +
              Object.entries(item.config)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', '),
          ]
            .filter(Boolean)
            .join(' · ')
        : item.variantName

    const validated = validateStripePayload({
      name: item.productName,
      description: desc ?? undefined,
      images: item.imageUrl ? [imageUrl(item.imageUrl)] : [],
      unit_amount: convertedPrice,
      quantity: item.quantity,
    })

    return {
      price_data: {
        currency: requestedCurrency.toLowerCase(),
        product_data: {
          name: validated.name,
          description: validated.description,
          images: validated.images,
        },
        unit_amount: validated.unit_amount,
      },
      quantity: validated.quantity,
    }
  })

  // Recalculate discount in target currency
  if (discountCents > 0 && discountId) {
    const convertedDiscount = convertPrice(discountCents, requestedCurrency)
    lineItems.push({
      price_data: {
        currency: requestedCurrency.toLowerCase(),
        product_data: {
          name: 'Discount',
          description: `Discount applied`,
        },
        unit_amount: -convertedDiscount,
      },
      quantity: 1,
    })
  }

  const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/checkout`

  // Metadata should probably store original CHF amounts and the currency used
  const metadata: Record<string, string> = {
    // cartItems removed to avoid 500 char limit - stored in abandoned_checkouts
    totalCents: String(totalCents),
    currency: requestedCurrency,
  }
  if (discountId) {
    metadata.discount_id = discountId
    metadata.discount_cents = String(discountCents)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id) metadata.user_id = user.id

  if (input?.email) {
    metadata.guest_email = input.email
    if (input.fullName) metadata.guest_name = input.fullName
  }

  try {
    const key = process.env.STRIPE_SECRET_KEY?.trim()
    console.log('[Checkout] Debug: Starting Stripe Session Create')
    console.log('[Checkout] Debug: Runtime:', process.env.NEXT_RUNTIME ?? 'Node (default)')
    console.log('[Checkout] Debug: Key Length:', key ? key.length : 'MISSING')
    console.log('[Checkout] Debug: Key Prefix:', key ? key.substring(0, 7) : 'N/A')
    console.log('[Checkout] Debug: Key Suffix (last 4):', key ? key.slice(-4) : 'N/A')
    console.log('[Checkout] Debug: URLs:', { successUrl, cancelUrl })
    console.log('[Checkout] Debug: Line Items:', JSON.stringify(lineItems, null, 2))
    console.log('[Checkout] Debug: Metadata:', JSON.stringify(metadata, null, 2))

    // Check for whitespace
    if (key && key.trim() !== key) {
      console.error('[Checkout] CRITICAL: Key has whitespace!')
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: input?.email ?? undefined,
      shipping_address_collection: {
        allowed_countries: ['CH', 'PT', 'ES', 'FR', 'DE', 'GB', 'US'] as const,
      },
      metadata,
    })

    console.log('[Checkout] Debug: Session created successfully', session.id)

    const emailForAbandoned = input?.email ?? undefined
    // DO NOT use fire-and-forget here - the webhook RELIES on this record.
    // Use admin client to ensure insertion succeeds regardless of user session state.
    try {
      const adminSupabase = getAdminClient()
      if (adminSupabase) {
        const { error } = await adminSupabase.from('abandoned_checkouts').insert({
          stripe_session_id: session.id,
          email: emailForAbandoned || 'guest@lopes2tech.ch', // Default if missing but table requires it
          cart_summary: {
            itemCount: validatedItems.reduce((s, { item }) => s + item.quantity, 0),
            totalCents,
            items: validatedItems.map(({ item }) => ({
              variantId: item.variantId,
              productId: item.productId,
              quantity: item.quantity,
              priceCents: item.priceCents,
              config: item.config ?? {},
              name: item.productName,
            })),
          },
        })
        if (error) {
          console.error('[Checkout] Abandoned checkout insert failed:', error.message)
        } else {
          console.log('[Checkout] Abandoned checkout recorded for session:', session.id)
        }
      } else {
        console.error('[Checkout] Admin client missing, skipping abandoned checkout recording')
      }
    } catch (err) {
      console.error('[Checkout] Abandoned checkout insert crashed:', err)
    }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[Checkout] Stripe Session Error:', err)
    console.error('[Checkout] Error Type:', err.type)
    console.error('[Checkout] Error Code:', err.code)
    console.error('[Checkout] Error Detail:', err.message)
    if (err.raw) {
      console.error('[Checkout] Raw Error:', JSON.stringify(err.raw, null, 2))
    }
    return { ok: false, error: err.message || 'Error occurred during checkout' }
  }
}
