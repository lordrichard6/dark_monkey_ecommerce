'use client'

import { useCart } from './CartProvider'

export function CartTrigger() {
  const { cart, toggleCart } = useCart()
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <button
      onClick={toggleCart}
      className="relative flex items-center gap-2 rounded p-2 text-zinc-400 transition hover:text-zinc-50"
      aria-label={`Cart with ${itemCount} items`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-medium text-zinc-950">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  )
}
