/**
 * Zone-based shipping rate configuration.
 * Rates are in CHF cents and match Printful's published rates for apparel.
 * Update these values when Printful changes their shipping prices.
 */

export type ShippingZone = {
  name: string
  countries: string[]
  /** CHF cents for the first item */
  firstItemCents: number
  /** CHF cents for each additional item */
  additionalItemCents: number
}

export const SHIPPING_ZONES: ShippingZone[] = [
  { name: 'Switzerland', countries: ['CH'], firstItemCents: 790, additionalItemCents: 290 },
  {
    name: 'Europe',
    countries: ['PT', 'ES', 'FR', 'DE'],
    firstItemCents: 890,
    additionalItemCents: 350,
  },
  { name: 'UK', countries: ['GB'], firstItemCents: 990, additionalItemCents: 390 },
  { name: 'USA', countries: ['US'], firstItemCents: 1290, additionalItemCents: 490 },
]

/** Free shipping threshold in CHF cents */
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000 // CHF 100

/** All countries that support shipping */
export const ALLOWED_SHIPPING_COUNTRIES = SHIPPING_ZONES.flatMap((z) => z.countries)

/** Country labels for the checkout selector */
export const COUNTRY_LABELS: Record<string, string> = {
  CH: 'Switzerland',
  PT: 'Portugal',
  ES: 'Spain',
  FR: 'France',
  DE: 'Germany',
  GB: 'United Kingdom',
  US: 'United States',
}

export type ShippingResult = {
  shippingCents: number
  isFreeShipping: boolean
  zoneName: string
  /** How many CHF cents remaining to unlock free shipping (0 if already free) */
  freeShippingRemaining: number
}

export function calculateShipping(
  countryCode: string,
  itemCount: number,
  subtotalCents: number
): ShippingResult {
  const zone = SHIPPING_ZONES.find((z) => z.countries.includes(countryCode))
  if (!zone) {
    return { shippingCents: 0, isFreeShipping: false, zoneName: '', freeShippingRemaining: 0 }
  }

  // Free shipping over threshold
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return { shippingCents: 0, isFreeShipping: true, zoneName: zone.name, freeShippingRemaining: 0 }
  }

  const count = Math.max(1, itemCount)
  const shippingCents = zone.firstItemCents + Math.max(0, count - 1) * zone.additionalItemCents
  const freeShippingRemaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents

  return { shippingCents, isFreeShipping: false, zoneName: zone.name, freeShippingRemaining }
}
