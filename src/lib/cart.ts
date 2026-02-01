import { cookies } from 'next/headers'
import type { Cart } from '@/types/cart'

const CART_COOKIE = 'cart'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function getCart(): Promise<Cart> {
  const cookieStore = await cookies()
  const cartCookie = cookieStore.get(CART_COOKIE)?.value
  if (!cartCookie) return { items: [] }
  try {
    const parsed = JSON.parse(cartCookie) as Cart
    if (Array.isArray(parsed?.items)) return parsed
  } catch {
    // invalid JSON
  }
  return { items: [] }
}

export function serializeCart(cart: Cart): string {
  return JSON.stringify(cart)
}

export function getCartCookieConfig() {
  return {
    name: CART_COOKIE,
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: false, // allow client read for hydration if needed
    secure: process.env.NODE_ENV === 'production',
  }
}
