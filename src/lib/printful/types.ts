export type PrintfulResponse<T> = {
    code: number
    result: T
    error?: {
        reason: string
        message: string
    }
    paging?: {
        total: number
        offset: number
        limit: number
    }
}

export type PrintfulSyncProduct = {
    id: number
    external_id: string | null
    name: string
    variants: number
    synced: number
    thumbnail_url: string
    is_ignored: boolean
}

export type PrintfulSyncVariant = {
    id: number
    external_id: string | null
    sync_product_id: number
    name: string
    synced: boolean
    variant_id: number
    warehouse_product_variant_id: number | null
    retail_price: string
    sku: string | null
    currency: string
    product: {
        variant_id: number
        product_id: number
        image: string
        name: string
    }
    files: PrintfulFile[]
    options: PrintfulOption[]
    /** Start of custom fields often returned but maybe not documented as core */
    size?: string
    color?: string
}

export type PrintfulFile = {
    id: number
    type: string
    hash: string | null
    url: string | null
    filename: string
    mime_type: string | null
    size: number
    width: number
    height: number
    dpi: number | null
    status: string
    created: number
    thumbnail_url: string
    preview_url: string
    visible: boolean
}

export type PrintfulOption = {
    id: string
    value: any
}

export type PrintfulSyncProductDetail = {
    sync_product: PrintfulSyncProduct
    sync_variants: PrintfulSyncVariant[]
}

// Catalog Types
export type PrintfulCatalogProduct = {
    id: number
    main_category_id: number
    type: string
    type_name: string
    title: string
    brand: string | null
    model: string
    image: string
    variant_count: number
    currency: string
    options: PrintfulCatalogOption[]
    dimensions: any
    is_discontinued: boolean
    avg_fulfillment_time: any
    description: string
}

export type PrintfulCatalogOption = {
    id: string
    title: string
    type: string
    values: any
    additional_price: string | null
}

export type PrintfulCatalogVariant = {
    id: number
    product_id: number
    name: string
    size: string
    color: string
    color_code: string
    color_code2: string | null
    image: string
    price: string
    in_stock: boolean
    availability_regions: any
    availability_status: any
}

// Order Types
export type PrintfulRecipient = {
    name: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
}

export type PrintfulOrderItem = {
    id?: number
    external_id?: string
    variant_id?: number
    sync_variant_id?: number
    external_variant_id?: string
    warehouse_product_variant_id?: number
    quantity: number
    price?: string
    retail_price?: string
    name?: string
    product?: any
    files?: Array<{
        type?: string
        url: string
        options?: any[]
        filename?: string
    }>
    options?: any[]
    sku?: string | null
}

export type PrintfulCreateOrderPayload = {
    recipient: PrintfulRecipient
    items: PrintfulOrderItem[]
    confirm?: 0 | 1
    external_id?: string
}

export type PrintfulOrder = {
    id: number
    external_id: string | null
    store: number
    status: 'draft' | 'pending' | 'failed' | 'canceled' | 'onhold' | 'inprocess' | 'partial' | 'fulfilled'
    shipping: string
    created: number
    updated: number
    recipient: PrintfulRecipient
    items: PrintfulOrderItem[]
    costs: {
        currency: string
        subtotal: string
        discount: string
        shipping: string
        digitization: string
        tax: string
        vat: string
        total: string
    }
}
