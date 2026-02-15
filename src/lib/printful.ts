import { rateLimiter } from './printful/rate-limiter'
import { fetchWithRetry } from './printful/retry'
import { printfulCache } from './printful/cache'
import { PRINTFUL_CONFIG } from './printful/config'
import { logger } from './printful/logger'
import { printfulAnalytics } from './printful/analytics'
import { PrintfulError, PrintfulAuthError, PrintfulApiError } from './printful/errors'
import type {
  PrintfulResponse,
  PrintfulRecipient,
  PrintfulCreateOrderPayload,
  PrintfulSyncProduct,
  PrintfulSyncProductDetail,
  PrintfulCatalogProduct,
  PrintfulCatalogVariant,
  PrintfulOrderItem
} from './printful/types'

export * from './printful/types'
export * from './printful/errors'

const API_BASE = PRINTFUL_CONFIG.API_BASE

export function isPrintfulConfigured(): boolean {
  return Boolean(PRINTFUL_CONFIG?.PRINTFUL_API_TOKEN)
}

function getHeaders(): Record<string, string> {
  const token = PRINTFUL_CONFIG?.PRINTFUL_API_TOKEN
  if (!token) throw new PrintfulAuthError('PRINTFUL_NOT_CONFIGURED')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function fetchPrintful<T>(url: string, options?: RequestInit): Promise<PrintfulResponse<T>> {
  const operation = `fetch:${url.split('printful.com')[1]?.split('?')[0] ?? 'unknown'}`

  return printfulAnalytics.trackDuration(operation, async () => {
    // Execute via rate limiter -> retry logic -> fetch
    const response = await rateLimiter.execute(() => fetchWithRetry(url, options))

    // Parse JSON
    let data: any
    try {
      data = await response.json()
    } catch (e) {
      throw new PrintfulApiError('Invalid JSON response', response.status)
    }

    // Handle API-level errors even if status was 200 (Printful sometimes returns 200 with error code)
    if (!response.ok || data.code !== 200) {
      const msg = data.error?.message ?? data.error?.reason ?? `HTTP ${response.status}`
      throw new PrintfulApiError(msg, response.status, data.error?.reason)
    }

    return data as PrintfulResponse<T>
  })
}

export async function createOrder(
  payload: PrintfulCreateOrderPayload,
  confirm = true
): Promise<{ ok: boolean; printfulOrderId?: number; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }

  const items = payload.items.map((item) => {
    // Basic mapping, assuming payload structure matches Printful requirements or is adapted here
    // The previous code had specific logic for sync_variant_id vs variant_id
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

  // @ts-ignore - Ignoring strict type check for now to match legacy payload structure if needed, 
  // or ideally we update PrintfulCreateOrderPayload to match exactly what we send.
  const body = {
    recipient: payload.recipient,
    items,
    confirm: confirm ? 1 : 0,
    external_id: payload.external_id,
  }

  try {
    const data = await fetchPrintful<{ id: number }>(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })

    if (data.result?.id) {
      return { ok: true, printfulOrderId: data.result.id }
    }

    return { ok: false, error: 'No order ID returned' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('createOrder failed', { operation: 'createOrder', error: message, items: payload.items.length })
    return { ok: false, error: message }
  }
}

/** Catalog product description - used when syncing from Store API */
export async function fetchCatalogProduct(
  productId: number
): Promise<{ ok: boolean; description?: string; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    const data = await fetchPrintful<{ product?: { description?: string } }>(`${API_BASE}/products/${productId}`, {
      headers: getHeaders(),
    })

    if (data.result?.product) {
      const desc = data.result.product.description
      return { ok: true, description: typeof desc === 'string' ? desc : undefined }
    }
    return { ok: false, error: 'No product description found' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

/** Catalog variant details (wholesale price, color codes, etc.) */
export async function fetchCatalogVariant(
  variantId: number
): Promise<{ ok: boolean; variant?: PrintfulCatalogVariant; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }

  // Check cache first
  const cacheKey = `catalog:variant:${variantId}`
  const cached = printfulCache.get<PrintfulCatalogVariant>(cacheKey)
  if (cached) {
    return { ok: true, variant: cached }
  }

  try {
    const data = await fetchPrintful<{ variant?: PrintfulCatalogVariant }>(`${API_BASE}/products/variant/${variantId}`, {
      headers: getHeaders(),
    })

    if (data.result?.variant) {
      // Cache the result
      printfulCache.set(cacheKey, data.result.variant)
      return { ok: true, variant: data.result.variant }
    }
    return { ok: false, error: 'No variant data found' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

export async function fetchStoreProducts(offset = 0, limit = PRINTFUL_CONFIG.CONSTANTS.SYNC_LIMIT, status?: string): Promise<{
  ok: boolean
  products?: PrintfulSyncProduct[]
  total?: number
  error?: string
}> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    let url = `${API_BASE}/store/products?offset=${offset}&limit=${limit}`
    if (status) {
      url += `&status=${status}`
    }

    const data = await fetchPrintful<PrintfulSyncProduct[]>(
      url,
      { headers: getHeaders() }
    )

    if (Array.isArray(data.result)) {
      return {
        ok: true,
        products: data.result,
        total: data.paging?.total ?? data.result.length,
      }
    }
    return { ok: false, error: 'Invalid response format' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

/**
 * Search the Global Printful Catalog
 */
export async function searchCatalogProducts(query: string): Promise<{
  ok: boolean
  products?: PrintfulCatalogProduct[]
  error?: string
}> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }
  try {
    // GET https://api.printful.com/products?search=...
    const data = await fetchPrintful<PrintfulCatalogProduct[]>(
      `${API_BASE}/products?search=${encodeURIComponent(query)}`,
      { headers: getHeaders() }
    )

    if (Array.isArray(data.result)) {
      return { ok: true, products: data.result }
    }
    return { ok: false, error: 'Invalid response format' }

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
    const data = await fetchPrintful<PrintfulSyncProductDetail>(`${API_BASE}/store/products/${id}`, {
      headers: getHeaders(),
    })

    if (data.result) {
      return { ok: true, product: data.result }
    }
    return { ok: false, error: 'No product data found' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

export async function fetchStoreOrder(
  orderId: number
): Promise<{ ok: boolean; order?: any; error?: string }> {
  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'PRINTFUL_NOT_CONFIGURED' }
  }

  try {
    // GET https://api.printful.com/orders/{id}
    // Note: The /orders endpoint returns order details including shipments
    const data = await fetchPrintful<any>(`${API_BASE}/orders/${orderId}`, {
      headers: getHeaders(),
    })

    if (data.result) {
      return { ok: true, order: data.result }
    }
    return { ok: false, error: 'Order not found' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

/** Default print file URL for products without customization. Use your logo hosted publicly. */
export function getDefaultPrintFileUrl(): string {
  const base =
    PRINTFUL_CONFIG?.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.dark-monkey.ch')
  return `${base.replace(/\/$/, '')}/logo.png`
}
