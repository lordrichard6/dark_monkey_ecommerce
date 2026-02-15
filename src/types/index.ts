import { Database } from './database'

export type ProductRow = Database['public']['Tables']['products']['Row']

export interface Product extends ProductRow {
    product_images?: any[]
    product_variants?: any[]
    categories?: any
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
