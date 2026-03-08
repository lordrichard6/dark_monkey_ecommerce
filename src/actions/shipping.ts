'use server'

import { getCart } from '@/lib/cart'
import { calculateShipping, ALLOWED_SHIPPING_COUNTRIES } from '@/lib/shipping'
import type { ShippingResult } from '@/lib/shipping'

export type ShippingCostResult = ({ ok: true } & ShippingResult) | { ok: false; error: string }

export async function getShippingCost(countryCode: string): Promise<ShippingCostResult> {
  if (!countryCode || !ALLOWED_SHIPPING_COUNTRIES.includes(countryCode)) {
    return { ok: false, error: 'Unsupported country' }
  }

  const cart = await getCart()
  if (cart.items.length === 0) {
    return { ok: false, error: 'Cart is empty' }
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalCents = cart.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)

  const result = calculateShipping(countryCode, itemCount, subtotalCents)

  return { ok: true, ...result }
}
