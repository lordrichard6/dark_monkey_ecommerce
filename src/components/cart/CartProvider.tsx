'use client'

import { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { updateCartItem, removeFromCart } from '@/actions/cart'
import type { Cart, CartItem } from '@/types/cart'

type CartContextValue = {
  cart: Cart
  isOpen: boolean
  isPending: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  updateItem: (variantId: string, quantity: number, config?: Record<string, unknown>) => void
  removeItem: (variantId: string, config?: Record<string, unknown>) => void
}

const CartContext = createContext<CartContextValue | null>(null)

function configKey(c: Record<string, unknown> | undefined): string {
  if (!c || Object.keys(c).length === 0) return ''
  const sorted = Object.keys(c)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = c[k]
      return acc
    }, {})
  return JSON.stringify(sorted)
}

const defaultCartContextValue: CartContextValue = {
  cart: { items: [] },
  isOpen: false,
  isPending: false,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
  updateItem: () => {},
  removeItem: () => {},
}

export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode
  initialCart: Cart
}) {
  const [cart, setCart] = useState(initialCart)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setCart(initialCart)
  }, [initialCart])

  function applyOptimistic(variantId: string, quantity: number, config?: Record<string, unknown>) {
    setCart((prev) => {
      const key = configKey(config)
      const idx = prev.items.findIndex(
        (i) => i.variantId === variantId && configKey(i.config) === key
      )
      const items: CartItem[] = [...prev.items]
      if (quantity <= 0) {
        if (idx >= 0) items.splice(idx, 1)
      } else if (idx >= 0) {
        items[idx] = { ...items[idx], quantity }
      }
      return { ...prev, items }
    })
  }

  function updateItem(variantId: string, quantity: number, config?: Record<string, unknown>) {
    applyOptimistic(variantId, quantity, config)
    startTransition(async () => {
      await updateCartItem(variantId, quantity, config)
    })
  }

  function removeItem(variantId: string, config?: Record<string, unknown>) {
    applyOptimistic(variantId, 0, config)
    startTransition(async () => {
      await removeFromCart(variantId, config)
    })
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isPending,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((o) => !o),
        updateItem,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  return ctx ?? defaultCartContextValue
}
