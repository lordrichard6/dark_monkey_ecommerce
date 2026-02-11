/**
 * Google Analytics Types
 * Type definitions for GA4 events and tracking
 */

// GA4 Window interface
declare global {
    interface Window {
        gtag?: (
            command: 'config' | 'event' | 'set' | 'get',
            targetId: string,
            config?: Record<string, any>
        ) => void
        dataLayer?: any[]
    }
}

// Product item for GA4 e-commerce
export type GAProduct = {
    item_id: string
    item_name: string
    price: number // In display currency (not cents)
    quantity?: number
    item_category?: string
    item_variant?: string
}

// E-commerce event types
export type GAEcommerceEvent =
    | 'view_item'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'begin_checkout'
    | 'add_payment_info'
    | 'purchase'
    | 'refund'

// Custom event types
export type GACustomEvent =
    | 'level_up'
    | 'unlock_achievement'
    | 'customize_product'
    | 'submit_review'
    | 'currency_change'
    | 'share'
    | 'search'
    | 'wishlist_add'
    | 'wishlist_remove'

export type GAEvent = GAEcommerceEvent | GACustomEvent | string

// Event parameters
export type GAEventParams = {
    currency?: string
    value?: number
    items?: GAProduct[]
    transaction_id?: string
    [key: string]: any
}

export { }
