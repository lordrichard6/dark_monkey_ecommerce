/**
 * Types for Printful Webhook Events
 * 
 * Reference: https://developers.printful.com/docs/#webhooks
 */

export type PrintfulWebhookType =
    | 'package_shipped'
    | 'package_returned'
    | 'order_failed'
    | 'order_canceled'
    | 'product_synced'
    | 'product_updated'
    | 'stock_updated'
    | 'order_created'
    | 'order_updated'

export interface PrintfulWebhookEvent<T = any> {
    type: PrintfulWebhookType
    created: number
    retries: number
    store: number
    data: T
}

export interface PrintfulShipmentInfo {
    id: number
    carrier: string
    service: string
    tracking_number: string
    tracking_url: string
    created: number
    ship_date: string
    shipped_at: string
    reshipment: boolean
}

export interface PrintfulPackageShippedPayload {
    order: {
        id: number
        external_id: string
        status: string
    }
    shipment: PrintfulShipmentInfo
}

export interface PrintfulOrderFailedPayload {
    order: {
        id: number
        external_id: string
        status: string
    }
    reason: string
}

export interface PrintfulOrderCanceledPayload {
    order: {
        id: number
        external_id: string
        status: string
    }
    reason: string
}
