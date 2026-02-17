'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getCart, serializeCart, getCartCookieConfig } from '@/lib/cart'
import type { CartItem } from '@/types/cart'

/**
 * Produces a stable string key from a product configuration object.
 * Used to identify cart items with the same variantId but different options
 * (e.g. different sizes, colors, or customizations).
 */
function configKey(c: Record<string, unknown> | undefined): string {
  if (!c || Object.keys(c).length === 0) return ''
  return JSON.stringify(c)
}

/**
 * Adds an item to the server-side cart cookie.
 * If an identical variant+config combination already exists, increments its quantity.
 * Revalidates the entire layout to reflect the updated cart count.
 *
 * @param item - Cart item to add. `quantity` defaults to 1 if omitted.
 */
export async function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
  const cart = await getCart()
  const quantity = item.quantity ?? 1
  const itemConfigKey = configKey(item.config)
  const existing = cart.items.findIndex(
    (i) => i.variantId === item.variantId && configKey(i.config) === itemConfigKey
  )
  if (existing >= 0) {
    cart.items[existing].quantity += quantity
  } else {
    cart.items.push({ ...item, quantity })
  }
  const cookieStore = await cookies()
  const config = getCartCookieConfig()
  cookieStore.set(config.name, serializeCart(cart), {
    maxAge: config.maxAge,
    path: config.path,
    sameSite: config.sameSite,
    secure: config.secure,
  })
  revalidatePath('/', 'layout')
}

/**
 * Updates the quantity of a specific cart item identified by `variantId` + optional config.
 * If `quantity` is 0 or less, the item is removed from the cart entirely.
 * Revalidates the entire layout after the update.
 *
 * @param variantId - Printful variant ID of the item to update.
 * @param quantity - New quantity. Pass 0 to remove the item.
 * @param itemConfig - Optional configuration object (e.g. size, color) to disambiguate items.
 */
export async function updateCartItem(
  variantId: string,
  quantity: number,
  itemConfig?: Record<string, unknown>
) {
  const cart = await getCart()
  const configKeyVal = configKey(itemConfig)
  const idx = cart.items.findIndex(
    (i) => i.variantId === variantId && configKey(i.config) === configKeyVal
  )
  if (idx < 0) return
  if (quantity <= 0) {
    cart.items.splice(idx, 1)
  } else {
    cart.items[idx].quantity = quantity
  }
  const cookieStore = await cookies()
  const config = getCartCookieConfig()
  cookieStore.set(config.name, serializeCart(cart), {
    maxAge: config.maxAge,
    path: config.path,
    sameSite: config.sameSite,
    secure: config.secure,
  })
  revalidatePath('/', 'layout')
}

/**
 * Removes a specific item from the cart cookie.
 * Thin wrapper around `updateCartItem` with quantity 0.
 *
 * @param variantId - Printful variant ID of the item to remove.
 * @param config - Optional configuration object to disambiguate items with the same variantId.
 */
export async function removeFromCart(variantId: string, config?: Record<string, unknown>) {
  await updateCartItem(variantId, 0, config)
}
