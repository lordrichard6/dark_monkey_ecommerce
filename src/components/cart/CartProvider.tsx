'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Cart } from '@/types/cart'

type CartContextValue = {
  cart: Cart
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const defaultCartContextValue: CartContextValue = {
  cart: { items: [] },
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
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

  useEffect(() => {
    setCart(initialCart)
  }, [initialCart])

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((o) => !o),
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
