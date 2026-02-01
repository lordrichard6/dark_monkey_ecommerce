export type CartItem = {
  variantId: string
  productId: string
  productSlug: string
  productName: string
  variantName: string | null
  priceCents: number
  quantity: number
  imageUrl?: string
  /** Customization config (engraving, text, etc.) — stored with order */
  config?: Record<string, unknown>
}

export type Cart = {
  items: CartItem[]
}
