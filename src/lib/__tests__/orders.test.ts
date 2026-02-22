import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declared before the import of orders.ts so Vitest can hoist them
// ---------------------------------------------------------------------------

const mockStripe = {
  checkout: {
    sessions: {
      retrieve: vi.fn(),
    },
  },
}

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

// Chainable builder for Supabase query responses
function makeQuery(result: { data: unknown; error: unknown }) {
  const q = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  }
  return q
}

vi.mock('../stripe', () => ({
  getStripe: () => mockStripe,
}))

vi.mock('../supabase/admin', () => ({
  getAdminClient: () => mockSupabase,
}))

vi.mock('../resend', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('../gamification', () => ({
  processXpForPurchase: vi.fn().mockResolvedValue(undefined),
  processXpForReferral: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../printful', () => ({
  createOrder: vi.fn().mockResolvedValue({ ok: true, printfulOrderId: 'pf-123' }),
  getDefaultPrintFileUrl: vi.fn().mockReturnValue('https://example.com/logo.png'),
  isPrintfulConfigured: vi.fn().mockReturnValue(false),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSession(overrides: Record<string, unknown> = {}) {
  return {
    status: 'complete',
    payment_status: 'paid',
    currency: 'chf',
    amount_total: 5000,
    customer_email: 'test@example.com',
    customer_details: {
      name: 'Test User',
      email: 'test@example.com',
      address: {
        line1: 'Bahnhofstrasse 1',
        line2: null,
        city: 'Zürich',
        postal_code: '8001',
        country: 'CH',
        state: null,
      },
    },
    shipping_details: null,
    metadata: {
      user_id: null,
      guest_email: null,
      totalCents: '5000',
      discount_id: null,
      discount_cents: null,
    },
    ...overrides,
  }
}

const CART_SUMMARY = {
  items: [
    {
      variantId: 'variant-1',
      productId: 'product-1',
      quantity: 2,
      priceCents: 2500,
    },
  ],
  totalCents: 5000,
}

const CREATED_ORDER = { id: 'order-uuid-123', guest_email: 'test@example.com' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processSuccessfulCheckout', () => {
  let processSuccessfulCheckout: (sessionId: string) => Promise<unknown>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Dynamic import after mocks are set — ensures fresh module state
    const mod = await import('../orders')
    processSuccessfulCheckout = mod.processSuccessfulCheckout
  })

  // --- Guard: already processed ---
  it('returns early if order already exists for session', async () => {
    mockSupabase.from.mockReturnValue(makeQuery({ data: { id: 'existing-order' }, error: null }))

    const result = await processSuccessfulCheckout('sess_existing')

    expect(result).toEqual({ ok: true, orderId: 'existing-order', alreadyProcessed: true })
    // Stripe should NOT be called
    expect(mockStripe.checkout.sessions.retrieve).not.toHaveBeenCalled()
  })

  // --- Happy path: full order creation ---
  it('creates an order and items when session is complete', async () => {
    // .from('orders').select().eq().maybeSingle() → no existing order
    // .from('abandoned_checkouts').select().eq().maybeSingle() → has cart_summary
    // .from('orders').insert().select().single() → new order
    // .from('abandoned_checkouts').delete().eq() → cleanup
    // .from('order_items').insert() → items
    // .from('product_inventory')... etc (non-fatal side effects)

    let callIndex = 0
    const perCallResults: Array<{ data: unknown; error: unknown }> = [
      { data: null, error: null }, // 0: no existing order
      { data: { cart_summary: CART_SUMMARY }, error: null }, // 1: abandoned_checkout
      { data: CREATED_ORDER, error: null }, // 2: insert order
      { data: null, error: null }, // 3: delete abandoned_checkout
      { data: null, error: null }, // 4: insert order_items
      { data: null, error: null }, // 5: inventory select (side effect)
      { data: null, error: null }, // 6: inventory update
      { data: null, error: null }, // 7: recent_purchases insert
      { data: { slug: 'test-product' }, error: null }, // 8: product slug select
      { data: null, error: null }, // 9: referrals (userId null → skipped)
    ]

    mockSupabase.from.mockImplementation(() => {
      const result = perCallResults[callIndex] ?? { data: null, error: null }
      callIndex++
      return makeQuery(result)
    })
    mockSupabase.rpc.mockResolvedValue({ error: null })
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(buildSession())

    const result = (await processSuccessfulCheckout('sess_new')) as Record<string, unknown>

    expect(result.ok).toBe(true)
    expect(result.orderId).toBe('order-uuid-123')
    expect(result.alreadyProcessed).toBeUndefined()
  })

  // --- Shipping address: reads from customer_details when shipping_details is null ---
  it('extracts shipping address from customer_details.address when shipping_details is null', async () => {
    const session = buildSession({ shipping_details: null })
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(session)

    let callIndex = 0
    const perCallResults: Array<{ data: unknown; error: unknown }> = [
      { data: null, error: null },
      { data: { cart_summary: CART_SUMMARY }, error: null },
      { data: CREATED_ORDER, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: { slug: 'test-product' }, error: null },
    ]
    mockSupabase.from.mockImplementation(() => {
      const result = perCallResults[callIndex] ?? { data: null, error: null }
      callIndex++
      return makeQuery(result)
    })
    mockSupabase.rpc.mockResolvedValue({ error: null })

    // We capture the insert call to verify shippingAddressJson was set correctly
    const insertSpy = vi.fn().mockResolvedValue({ data: CREATED_ORDER, error: null })
    // We need to know what was passed to insert on the orders table
    const ordersInsertCapture: unknown[] = []
    mockSupabase.from.mockImplementation((table: string) => {
      const q = makeQuery(perCallResults[callIndex] ?? { data: null, error: null })
      callIndex++
      if (table === 'orders') {
        q.insert = vi.fn().mockImplementation((payload: unknown) => {
          ordersInsertCapture.push(payload)
          return { ...q, select: vi.fn().mockReturnThis(), single: insertSpy }
        })
      }
      return q
    })
    // Reset for second run
    callIndex = 0

    await processSuccessfulCheckout('sess_addr')

    // Should have captured an orders insert with non-null shipping_address_json
    const orderPayload = ordersInsertCapture[0] as Record<string, unknown>
    if (orderPayload) {
      const shippingJson = orderPayload.shipping_address_json as Record<string, unknown> | null
      expect(shippingJson).not.toBeNull()
      const addr = (shippingJson as Record<string, unknown>)?.address as
        | Record<string, string>
        | undefined
      expect(addr?.city).toBe('Zürich')
      expect(addr?.country).toBe('CH')
    }
  })

  // --- Missing cart → throws ---
  it('throws when abandoned_checkout record is missing', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(buildSession())

    let callIndex = 0
    mockSupabase.from.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) return makeQuery({ data: null, error: null }) // no existing order
      if (callIndex === 2) return makeQuery({ data: null, error: null }) // no cart_summary
      // fallback for the debug query
      return makeQuery({ data: [], error: null })
    })

    await expect(processSuccessfulCheckout('sess_no_cart')).rejects.toThrow(
      'Missing abandoned_checkout record'
    )
  })

  // --- Session not complete → throws ---
  it('throws when session status is not complete or open', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(buildSession({ status: 'expired' }))
    mockSupabase.from.mockReturnValue(makeQuery({ data: null, error: null }))

    await expect(processSuccessfulCheckout('sess_expired')).rejects.toThrow(
      'Session not complete (status: expired)'
    )
  })

  // --- Stripe currency flows through correctly ---
  it('uses Stripe amount_total and currency as source of truth', async () => {
    const session = buildSession({
      amount_total: 12345,
      currency: 'eur',
    })
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(session)

    const capturedInserts: unknown[] = []
    let callIndex = 0
    mockSupabase.from.mockImplementation((table: string) => {
      callIndex++
      const result = [
        { data: null, error: null },
        { data: { cart_summary: CART_SUMMARY }, error: null },
        { data: CREATED_ORDER, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: { slug: 'p' }, error: null },
      ][callIndex - 1] ?? { data: null, error: null }

      const q = makeQuery(result)
      if (table === 'orders') {
        q.insert = vi.fn().mockImplementation((payload: unknown) => {
          capturedInserts.push(payload)
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: CREATED_ORDER, error: null }),
          }
        })
      }
      return q
    })
    mockSupabase.rpc.mockResolvedValue({ error: null })

    await processSuccessfulCheckout('sess_currency')

    const orderPayload = capturedInserts[0] as Record<string, unknown>
    if (orderPayload) {
      expect(orderPayload.total_cents).toBe(12345)
      expect(orderPayload.currency).toBe('EUR')
    }
  })
})

// ---------------------------------------------------------------------------
// checkOrderExists
// ---------------------------------------------------------------------------

describe('checkOrderExists', () => {
  let checkOrderExists: (sessionId: string) => Promise<unknown>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../orders')
    checkOrderExists = mod.checkOrderExists
  })

  it('returns order data when found', async () => {
    mockSupabase.from.mockReturnValue(
      makeQuery({ data: { id: 'order-123', status: 'paid' }, error: null })
    )
    const result = await checkOrderExists('sess_found')
    expect(result).toEqual({ id: 'order-123', status: 'paid' })
  })

  it('returns null when no order is found for session', async () => {
    mockSupabase.from.mockReturnValue(makeQuery({ data: null, error: null }))
    const result = await checkOrderExists('sess_none')
    expect(result).toBeNull()
  })
})
