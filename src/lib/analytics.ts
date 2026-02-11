/**
 * Google Analytics 4 Tracking Library
 * Centralized analytics tracking for e-commerce and custom events
 */

import type { GAEvent, GAEventParams, GAProduct } from '@/types/analytics'

/**
 * Check if GA4 is loaded and ready
 */
function isGAReady(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Send a custom event to GA4
 */
export function trackEvent(event: GAEvent, params?: GAEventParams): void {
    if (!isGAReady()) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4]', event, params)
        }
        return
    }

    window.gtag!('event', event, params)
}

// ============================================================================
// E-COMMERCE EVENTS
// ============================================================================

/**
 * Track product view
 */
export function trackProductView(product: {
    id: string
    name: string
    price: number // cents
    currency: string
    category?: string
    variant?: string
}): void {
    trackEvent('view_item', {
        currency: product.currency,
        value: product.price / 100,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.price / 100,
                item_category: product.category,
                item_variant: product.variant,
            },
        ],
    })
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: {
    id: string
    name: string
    price: number // cents
    currency: string
    quantity: number
    category?: string
    variant?: string
}): void {
    trackEvent('add_to_cart', {
        currency: product.currency,
        value: (product.price * product.quantity) / 100,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.price / 100,
                quantity: product.quantity,
                item_category: product.category,
                item_variant: product.variant,
            },
        ],
    })
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(product: {
    id: string
    name: string
    price: number // cents
    currency: string
    quantity: number
}): void {
    trackEvent('remove_from_cart', {
        currency: product.currency,
        value: (product.price * product.quantity) / 100,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.price / 100,
                quantity: product.quantity,
            },
        ],
    })
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(cart: {
    total: number // cents
    currency: string
    items: Array<{
        id: string
        name: string
        price: number // cents
        quantity: number
        category?: string
        variant?: string
    }>
}): void {
    trackEvent('begin_checkout', {
        currency: cart.currency,
        value: cart.total / 100,
        items: cart.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price / 100,
            quantity: item.quantity,
            item_category: item.category,
            item_variant: item.variant,
        })),
    })
}

/**
 * Track add payment info
 */
export function trackAddPaymentInfo(cart: {
    total: number // cents
    currency: string
    paymentMethod?: string
}): void {
    trackEvent('add_payment_info', {
        currency: cart.currency,
        value: cart.total / 100,
        payment_type: cart.paymentMethod || 'stripe',
    })
}

/**
 * Track purchase (conversion event!)
 */
export function trackPurchase(order: {
    orderId: string
    total: number // cents
    currency: string
    tax?: number // cents
    shipping?: number // cents
    items: Array<{
        id: string
        name: string
        price: number // cents
        quantity: number
        category?: string
        variant?: string
    }>
}): void {
    trackEvent('purchase', {
        transaction_id: order.orderId,
        value: order.total / 100,
        currency: order.currency,
        tax: order.tax ? order.tax / 100 : undefined,
        shipping: order.shipping ? order.shipping / 100 : undefined,
        items: order.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price / 100,
            quantity: item.quantity,
            item_category: item.category,
            item_variant: item.variant,
        })),
    })
}

// ============================================================================
// GAMIFICATION EVENTS
// ============================================================================

/**
 * Track level up / tier change
 */
export function trackLevelUp(tier: string, totalXp: number): void {
    trackEvent('level_up', {
        level: tier,
        character: 'player',
        total_xp: totalXp,
    })
}

/**
 * Track badge earned
 */
export function trackBadgeEarned(badgeCode: string, badgeName: string): void {
    trackEvent('unlock_achievement', {
        achievement_id: badgeCode,
        achievement_name: badgeName,
    })
}

/**
 * Track mission completed
 */
export function trackMissionCompleted(missionName: string): void {
    trackEvent('complete_mission', {
        mission_name: missionName,
    })
}

/**
 * Track XP gained
 */
export function trackXPGained(amount: number, source: string): void {
    trackEvent('earn_xp', {
        xp_amount: amount,
        xp_source: source,
    })
}

/**
 * Track referral conversion
 */
export function trackReferralConversion(referralCode: string): void {
    trackEvent('referral_conversion', {
        referral_code: referralCode,
    })
}

// ============================================================================
// PRODUCT FEATURE EVENTS
// ============================================================================

/**
 * Track product customization
 */
export function trackCustomization(
    productId: string,
    productName: string,
    options: Record<string, string>
): void {
    trackEvent('customize_product', {
        item_id: productId,
        item_name: productName,
        customization_count: Object.keys(options).length,
        customizations: JSON.stringify(options),
    })
}

/**
 * Track review submission
 */
export function trackReviewSubmit(product: {
    id: string
    name: string
    rating: number
    hasPhotos: boolean
}): void {
    trackEvent('submit_review', {
        item_id: product.id,
        item_name: product.name,
        rating: product.rating,
        has_photos: product.hasPhotos,
    })
}

/**
 * Track photo upload
 */
export function trackPhotoUpload(productId: string, photoCount: number): void {
    trackEvent('upload_photo', {
        item_id: productId,
        photo_count: photoCount,
    })
}

/**
 * Track wishlist add
 */
export function trackWishlistAdd(product: {
    id: string
    name: string
    price: number
    currency: string
}): void {
    trackEvent('wishlist_add', {
        item_id: product.id,
        item_name: product.name,
        value: product.price / 100,
        currency: product.currency,
    })
}

/**
 * Track wishlist remove
 */
export function trackWishlistRemove(productId: string): void {
    trackEvent('wishlist_remove', {
        item_id: productId,
    })
}

/**
 * Track product share
 */
export function trackShare(product: {
    id: string
    name: string
    method: string
}): void {
    trackEvent('share', {
        content_type: 'product',
        item_id: product.id,
        item_name: product.name,
        method: product.method,
    })
}

// ============================================================================
// CURRENCY & LOCALIZATION EVENTS
// ============================================================================

/**
 * Track currency change
 */
export function trackCurrencyChange(from: string, to: string): void {
    trackEvent('currency_change', {
        previous_currency: from,
        new_currency: to,
    })
}

/**
 * Track language change
 */
export function trackLanguageChange(from: string, to: string): void {
    trackEvent('language_change', {
        previous_language: from,
        new_language: to,
    })
}

// ============================================================================
// USER BEHAVIOR EVENTS
// ============================================================================

/**
 * Track search
 */
export function trackSearch(term: string, resultsCount: number): void {
    trackEvent('search', {
        search_term: term,
        results_count: resultsCount,
    })
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: number): void {
    if (depth === 25 || depth === 50 || depth === 75 || depth === 100) {
        trackEvent('scroll', {
            percent_scrolled: depth,
        })
    }
}

/**
 * Track engagement time (seconds)
 */
export function trackEngagementTime(seconds: number): void {
    trackEvent('user_engagement', {
        engagement_time_msec: seconds * 1000,
    })
}

/**
 * Track form abandonment
 */
export function trackFormAbandonment(formName: string, fieldsFilled: number): void {
    trackEvent('form_abandonment', {
        form_name: formName,
        fields_filled: fieldsFilled,
    })
}
