'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getCart, serializeCart, getCartCookieConfig } from '@/lib/cart'
import type { CartItem } from '@/types/cart'

function configKey(c: Record<string, unknown> | undefined): string {
  if (!c || Object.keys(c).length === 0) return ''
  return JSON.stringify(c)
}

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

export async function removeFromCart(variantId: string, config?: Record<string, unknown>) {
  await updateCartItem(variantId, 0, config)
}
