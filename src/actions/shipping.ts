'use server'

import { getCart } from '@/lib/cart'
import { calculateShipping, ALLOWED_SHIPPING_COUNTRIES } from '@/lib/shipping'
import type { ShippingResult } from '@/lib/shipping'
import { getShippingZones, getFreeShippingThreshold } from '@/actions/admin-shipping'

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

  const [zones, threshold] = await Promise.all([getShippingZones(), getFreeShippingThreshold()])

  // Map DB rows to ShippingZone shape
  const mappedZones = zones.map((z) => ({
    name: z.name,
    countries: z.countries,
    firstItemCents: z.first_item_cents,
    additionalItemCents: z.additional_item_cents,
  }))

  const result = calculateShipping(countryCode, itemCount, subtotalCents, mappedZones, threshold)

  return { ok: true, ...result }
}
