const API_BASE = 'https://api.printful.com'

export function isPrintfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_TOKEN?.trim())
}

function getHeaders(): Record<string, string> {
  const token = process.env.PRINTFUL_API_TOKEN
  if (!token) throw new Error('PRINTFUL_NOT_CONFIGURED')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export type PrintfulRecipient = {
  name: string
  address1: string
  city: string
  state_code?: string
  country_code: string
  zip: string
  phone?: string
  email?: string
}

export type PrintfulOrderItem = {
  /** Catalog variant ID (when using Catalog API products) */
  variant_id?: number
  /** Sync variant ID (when using products synced from Printful store) */
  sync_variant_id?: number
  quantity: number
  files?: { type?: string; url: string }[]
  retail_price?: string
}

export type PrintfulCreateOrderPayload = {
  recipient: PrintfulRecipient
  items: PrintfulOrderItem[]
  confirm?: 0 | 1
  external_id?: string
}

export type PrintfulOrderResponse = {
  code: number
  result?: { id: number }
  error?: { reason?: string; message?: string }
}

export async function createOrder(
  payload: PrintfulCreateOrderPayload,
  confirm = true
): Promise<{ ok: boolean; printfulOrderId?: number; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }

  const items = payload.items.map((item) => {
    const base = {
      quantity: item.quantity,
      files: item.files,
      retail_price: item.retail_price,
    }
    if (item.sync_variant_id != null) {
      return { ...base, sync_variant_id: item.sync_variant_id }
    }
    return { ...base, variant_id: item.variant_id! }
  })

  const body = {
    recipient: payload.recipient,
    items,
    confirm: confirm ? 1 : 0,
    external_id: payload.external_id,
  }

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as PrintfulOrderResponse

    if (res.ok && data.code === 200 && data.result?.id) {
      return { ok: true, printfulOrderId: data.result.id }
    }

    const msg =
      data.error?.message ?? data.error?.reason ?? `HTTP ${res.status}`
    return { ok: false, error: msg }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Printful createOrder error:', err)
    return { ok: false, error: message }
  }
}

export type PrintfulSyncProduct = {
  id: number
  external_id: string | null
  name: string
  variants: number
  thumbnail_url: string
}

export type PrintfulSyncProductDetail = {
  sync_product: {
    id: number
    external_id: string | null
    name: string
    thumbnail_url: string
  }
  sync_variants: Array<{
    id: number
    external_id: string | null
    variant_id: number
    retail_price: string
    product: { variant_id: number; product_id?: number; name: string; image: string }
    sku: string | null
    size?: string
    color?: string
    files?: Array<{ type?: string; preview_url?: string; thumbnail_url?: string }>
  }>
}

/** Catalog product description - used when syncing from Store API */
export async function fetchCatalogProduct(
  productId: number
): Promise<{ ok: boolean; description?: string; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      headers: getHeaders(),
    })
    const data = (await res.json()) as {
      code: number
      result?: { product?: { description?: string } }
      error?: { message?: string }
    }
    if (res.ok && data.code === 200 && data.result?.product) {
      const desc = data.result.product.description
      return { ok: true, description: typeof desc === 'string' ? desc : undefined }
    }
    return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

/** Catalog variant details (wholesale price, color codes, etc.) */
export async function fetchCatalogVariant(
  variantId: number
): Promise<{ ok: boolean; variant?: any; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    const res = await fetch(`${API_BASE}/products/variant/${variantId}`, {
      headers: getHeaders(),
    })
    const data = (await res.json()) as {
      code: number
      result?: { variant?: any }
      error?: { message?: string }
    }
    if (res.ok && data.code === 200 && data.result?.variant) {
      return { ok: true, variant: data.result.variant }
    }
    return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

export async function fetchStoreProducts(offset = 0, limit = 20): Promise<{
  ok: boolean
  products?: PrintfulSyncProduct[]
  total?: number
  error?: string
}> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    const res = await fetch(
      `${API_BASE}/store/products?offset=${offset}&limit=${limit}`,
      { headers: getHeaders() }
    )
    const data = (await res.json()) as {
      code: number
      result?: PrintfulSyncProduct[]
      paging?: { total: number }
      error?: { message?: string }
    }
    if (res.ok && data.code === 200 && Array.isArray(data.result)) {
      return {
        ok: true,
        products: data.result,
        total: data.paging?.total ?? data.result.length,
      }
    }
    return {
      ok: false,
      error: data.error?.message ?? `HTTP ${res.status}`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

export async function fetchSyncProduct(
  id: number
): Promise<{ ok: boolean; product?: PrintfulSyncProductDetail; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    const res = await fetch(`${API_BASE}/store/products/${id}`, {
      headers: getHeaders(),
    })
    const data = (await res.json()) as {
      code: number
      result?: PrintfulSyncProductDetail
      error?: { message?: string }
    }
    if (res.ok && data.code === 200 && data.result) {
      return { ok: true, product: data.result }
    }
    return {
      ok: false,
      error: data.error?.message ?? `HTTP ${res.status}`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

/** Default print file URL for products without customization. Use your logo hosted publicly. */
export function getDefaultPrintFileUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.dark-monkey.ch')
  return `${base.replace(/\/$/, '')}/logo.png`
}
