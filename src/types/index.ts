import { Database } from './database'

export type ProductRow = Database['public']['Tables']['products']['Row']

export interface Product extends ProductRow {
  product_images?: {
    url: string
    alt: string | null
    sort_order: number
    color?: string | null
    variant_id?: string | null
  }[]
  product_variants?: {
    id: string
    name: string | null
    price_cents: number
    attributes: Record<string, string>
    sort_order: number
    product_inventory?: { quantity: number } | { quantity: number }[] | null
  }[]
  categories?: { id?: string; name?: string; slug?: string } | null
  relevanceScore?: number
  // For display purposes in some components
  price_cents?: number
  image_url?: string
}

export * from './product'
export * from './cart'
export * from './analytics'
export * from './customization'
export * from './database'
