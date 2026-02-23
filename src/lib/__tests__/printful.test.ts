import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — hoisted before the printful module is imported
// ---------------------------------------------------------------------------

const mockFetchWithRetry = vi.fn()

vi.mock('../printful/config', () => ({
  PRINTFUL_CONFIG: {
    PRINTFUL_API_TOKEN: 'test-token',
    PRINTFUL_STORE_ID: 'store-123',
    API_BASE: 'https://api.printful.com',
    NEXT_PUBLIC_SITE_URL: 'https://www.dark-monkey.ch',
    CONSTANTS: { SYNC_LIMIT: 100 },
  },
}))

vi.mock('../printful/rate-limiter', () => ({
  rateLimiter: { execute: vi.fn((fn: () => unknown) => fn()) },
}))

vi.mock('../printful/retry', () => ({
  fetchWithRetry: mockFetchWithRetry,
}))

vi.mock('../printful/analytics', () => ({
  printfulAnalytics: {
    trackDuration: vi.fn((_op: string, fn: () => unknown) => fn()),
  },
}))

vi.mock('../printful/cache', () => ({
  printfulCache: { get: vi.fn().mockReturnValue(null), set: vi.fn() },
}))

vi.mock('../printful/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockPrintfulResponse(body: object, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }
}

const BASE_RECIPIENT = {
  name: 'Test User',
  address1: 'Bahnhofstrasse 1',
  city: 'Zürich',
  country_code: 'CH',
  zip: '8001',
  email: 'test@example.com',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isPrintfulConfigured', () => {
  it('returns true when PRINTFUL_API_TOKEN is set', async () => {
    const { isPrintfulConfigured } = await import('../printful')
    expect(isPrintfulConfigured()).toBe(true)
  })
})

describe('createOrder', () => {
  let createOrder: typeof import('../printful').createOrder

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../printful')
    createOrder = mod.createOrder
  })

  // --- Not configured ---
  it('returns { ok: false } immediately when Printful is not configured', async () => {
    // Override config for this test only
    const { PRINTFUL_CONFIG } = await import('../printful/config')
    const original = (PRINTFUL_CONFIG as Record<string, unknown>).PRINTFUL_API_TOKEN
    ;(PRINTFUL_CONFIG as Record<string, unknown>).PRINTFUL_API_TOKEN = ''

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1 }],
    })

    expect(result).toEqual({ ok: false, error: 'PRINTFUL_NOT_CONFIGURED' })
    expect(mockFetchWithRetry).not.toHaveBeenCalled()
    ;(PRINTFUL_CONFIG as Record<string, unknown>).PRINTFUL_API_TOKEN = original
  })

  // --- Success: sync_variant_id path ---
  it('creates order with sync_variant_id and returns printfulOrderId', async () => {
    mockFetchWithRetry.mockResolvedValue(mockPrintfulResponse({ code: 200, result: { id: 98765 } }))

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 12345, quantity: 2, retail_price: '25.00' }],
      external_id: 'orderuuid',
    })

    expect(result).toEqual({ ok: true, printfulOrderId: 98765 })

    // Verify the HTTP call
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
    const [url, options] = mockFetchWithRetry.mock.calls[0]
    expect(url).toBe('https://api.printful.com/orders')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.recipient).toMatchObject({ name: 'Test User', country_code: 'CH' })
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toMatchObject({ sync_variant_id: 12345, quantity: 2 })
    expect(body.items[0].variant_id).toBeUndefined()
    expect(body.external_id).toBe('orderuuid')
  })

  // --- Success: variant_id (catalog) path ---
  it('creates order with variant_id and includes files when no sync_variant_id', async () => {
    mockFetchWithRetry.mockResolvedValue(mockPrintfulResponse({ code: 200, result: { id: 54321 } }))

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [
        {
          variant_id: 9999,
          quantity: 1,
          retail_price: '19.99',
          files: [{ url: 'https://www.dark-monkey.ch/logo.png', type: 'default' }],
        },
      ],
    })

    expect(result).toEqual({ ok: true, printfulOrderId: 54321 })

    const body = JSON.parse(mockFetchWithRetry.mock.calls[0][1].body)
    expect(body.items[0]).toMatchObject({ variant_id: 9999, quantity: 1 })
    expect(body.items[0].files[0]).toMatchObject({ url: 'https://www.dark-monkey.ch/logo.png' })
    expect(body.items[0].sync_variant_id).toBeUndefined()
  })

  // --- sync_variant_id takes priority over variant_id ---
  it('prefers sync_variant_id over variant_id when both are present', async () => {
    mockFetchWithRetry.mockResolvedValue(mockPrintfulResponse({ code: 200, result: { id: 111 } }))

    await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 777, variant_id: 888, quantity: 1 }],
    })

    const body = JSON.parse(mockFetchWithRetry.mock.calls[0][1].body)
    expect(body.items[0].sync_variant_id).toBe(777)
    expect(body.items[0].variant_id).toBeUndefined()
  })

  // --- Authorization header ---
  it('sends Bearer token and store ID in request headers', async () => {
    mockFetchWithRetry.mockResolvedValue(mockPrintfulResponse({ code: 200, result: { id: 1 } }))

    await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1 }],
    })

    const headers = mockFetchWithRetry.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer test-token')
    expect(headers['X-PF-Store-Id']).toBe('store-123')
  })

  // --- API error response (code != 200) ---
  it('returns { ok: false } when Printful API returns an error code', async () => {
    mockFetchWithRetry.mockResolvedValue(
      mockPrintfulResponse(
        { code: 400, error: { reason: 'BadRequest', message: 'Invalid recipient address' } },
        400
      )
    )

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1 }],
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Invalid recipient address')
  })

  // --- HTTP 401 Unauthorized ---
  it('returns { ok: false } on 401 Unauthorized', async () => {
    mockFetchWithRetry.mockResolvedValue(
      mockPrintfulResponse(
        { code: 401, error: { reason: 'Unauthorized', message: 'Invalid token' } },
        401
      )
    )

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1 }],
    })

    expect(result.ok).toBe(false)
  })

  // --- Network / parse failure ---
  it('returns { ok: false } when fetch throws a network error', async () => {
    mockFetchWithRetry.mockRejectedValue(new Error('Network timeout'))

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1 }],
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Network timeout')
  })

  // --- Missing order ID in successful response ---
  it('returns { ok: false } when API returns 200 but no order id', async () => {
    mockFetchWithRetry.mockResolvedValue(
      mockPrintfulResponse({ code: 200, result: {} }) // result has no id
    )

    const result = await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1 }],
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('No order ID returned')
  })

  // --- retail_price is always a string ---
  it('converts numeric retail_price to string in the payload', async () => {
    mockFetchWithRetry.mockResolvedValue(mockPrintfulResponse({ code: 200, result: { id: 1 } }))

    await createOrder({
      recipient: BASE_RECIPIENT,
      items: [{ sync_variant_id: 1, quantity: 1, retail_price: '29.90' }],
    })

    const body = JSON.parse(mockFetchWithRetry.mock.calls[0][1].body)
    expect(typeof body.items[0].retail_price).toBe('string')
    expect(body.items[0].retail_price).toBe('29.90')
  })
})
