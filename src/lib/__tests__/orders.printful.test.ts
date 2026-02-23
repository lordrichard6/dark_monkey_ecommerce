import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockStripe = {
  checkout: { sessions: { retrieve: vi.fn() } },
}

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

const mockCreatePrintfulOrder = vi.fn()

// Chainable Supabase query builder with thenable support so chains like
// .select().in(...) or .update().eq(...) can be awaited directly.
function makeQuery(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {}
  const self = () => q
  q.select = vi.fn().mockReturnValue(q)
  q.insert = vi.fn().mockReturnValue(q)
  q.update = vi.fn().mockReturnValue(q)
  q.delete = vi.fn().mockReturnValue(q)
  q.eq = vi.fn().mockReturnValue(q)
  q.in = vi.fn().mockReturnValue(q)
  q.is = vi.fn().mockReturnValue(q)
  q.limit = vi.fn().mockReturnValue(q)
  q.maybeSingle = vi.fn().mockResolvedValue(result)
  q.single = vi.fn().mockResolvedValue(result)
  // Makes `await supabase.from('x').select().in(...)` resolve to `result`
  q.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return q
}

// Build a mock that routes DB calls by table name, each table having an
// independent response queue (avoids fragile absolute call-index ordering).
function buildFromMock(tableResponses: Record<string, Array<{ data: unknown; error: unknown }>>) {
  const callCounts: Record<string, number> = {}

  return vi.fn((table: string) => {
    const idx = callCounts[table] ?? 0
    callCounts[table] = idx + 1
    const responses = tableResponses[table] ?? []
    const result = responses[idx] ?? { data: null, error: null }
    return makeQuery(result)
  })
}

vi.mock('../stripe', () => ({ getStripe: () => mockStripe }))
vi.mock('../supabase/admin', () => ({ getAdminClient: () => mockSupabase }))
vi.mock('../resend', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue({ ok: true }),
}))
vi.mock('../gamification', () => ({
  processXpForPurchase: vi.fn().mockResolvedValue(undefined),
  processXpForReferral: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../printful', () => ({
  createOrder: mockCreatePrintfulOrder,
  getDefaultPrintFileUrl: vi.fn().mockReturnValue('https://www.dark-monkey.ch/logo.png'),
  isPrintfulConfigured: vi.fn().mockReturnValue(true), // Enabled for ALL tests in this file
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_WITH_SHIPPING = {
  status: 'complete',
  payment_status: 'paid',
  currency: 'chf',
  amount_total: 5000,
  customer_email: 'buyer@example.com',
  customer_details: {
    name: 'Hans Muster',
    email: 'buyer@example.com',
    address: {
      line1: 'Bahnhofstrasse 1',
      line2: null,
      city: 'Zürich',
      postal_code: '8001',
      country: 'CH',
      state: null,
    },
  },
  shipping_details: null, // falls back to customer_details
  metadata: {
    user_id: null,
    guest_email: null,
    totalCents: '5000',
    discount_id: null,
    discount_cents: null,
  },
}

const SESSION_NO_ADDRESS = {
  ...SESSION_WITH_SHIPPING,
  customer_details: { name: 'No Address', email: 'buyer@example.com', address: null },
}

const CART_SUMMARY = {
  items: [{ variantId: 'var-1', productId: 'prod-1', quantity: 2, priceCents: 2500 }],
  totalCents: 5000,
}

const CREATED_ORDER = { id: 'order-uuid-abcd-1234', guest_email: 'buyer@example.com' }

// Standard success setup for DB tables
function successTableResponses(variantRow: Record<string, unknown>) {
  return {
    orders: [
      { data: null, error: null }, // check existing → none
      { data: CREATED_ORDER, error: null }, // insert → created
      { data: null, error: null }, // update printful_order_id
    ],
    abandoned_checkouts: [
      { data: { cart_summary: CART_SUMMARY }, error: null }, // select cart
      { data: null, error: null }, // delete record
    ],
    order_items: [{ data: null, error: null }],
    product_variants: [{ data: [variantRow], error: null }],
    product_inventory: [
      { data: { quantity: 10 }, error: null },
      { data: null, error: null },
    ],
    recent_purchases: [{ data: null, error: null }],
    products: [{ data: { slug: 'test-product' }, error: null }],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processSuccessfulCheckout — Printful integration', () => {
  let processSuccessfulCheckout: (id: string) => Promise<unknown>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockCreatePrintfulOrder.mockResolvedValue({ ok: true, printfulOrderId: 98765 })
    mockSupabase.rpc.mockResolvedValue({ error: null })
    // Re-assert default: Printful is configured for every test in this file.
    // vi.clearAllMocks() clears call counts but NOT mock implementations,
    // so we must explicitly reset after any test that overrides this.
    const { isPrintfulConfigured } = await import('../printful')
    vi.mocked(isPrintfulConfigured).mockReturnValue(true)
    const mod = await import('../orders')
    processSuccessfulCheckout = mod.processSuccessfulCheckout
  })

  // --- Core: Printful is called with correct recipient ---
  it('calls createOrder with recipient mapped from customer_details.address', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 12345,
        printful_variant_id: null,
      })
    )

    await processSuccessfulCheckout('sess_1')

    expect(mockCreatePrintfulOrder).toHaveBeenCalledOnce()
    const [payload] = mockCreatePrintfulOrder.mock.calls[0]
    expect(payload.recipient).toMatchObject({
      name: 'Hans Muster',
      address1: 'Bahnhofstrasse 1',
      city: 'Zürich',
      country_code: 'CH',
      zip: '8001',
    })
  })

  // --- Core: sync_variant_id path ---
  it('sends sync_variant_id when variant has printful_sync_variant_id', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 12345,
        printful_variant_id: null,
      })
    )

    await processSuccessfulCheckout('sess_2')

    const [payload] = mockCreatePrintfulOrder.mock.calls[0]
    expect(payload.items).toHaveLength(1)
    expect(payload.items[0]).toMatchObject({
      sync_variant_id: 12345,
      quantity: 2,
      retail_price: '25.00', // 2500 cents / 100
    })
    expect(payload.items[0].variant_id).toBeUndefined()
    expect(payload.items[0].files).toBeUndefined()
  })

  // --- Core: catalog variant_id fallback path ---
  it('sends variant_id + logo file when only printful_variant_id is set', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: null,
        printful_variant_id: 9999,
      })
    )

    await processSuccessfulCheckout('sess_3')

    const [payload] = mockCreatePrintfulOrder.mock.calls[0]
    expect(payload.items[0]).toMatchObject({ variant_id: 9999, quantity: 2 })
    expect(payload.items[0].sync_variant_id).toBeUndefined()
    expect(payload.items[0].files).toHaveLength(1)
    expect(payload.items[0].files[0].url).toContain('logo.png')
  })

  // --- Core: external_id is UUID without hyphens ---
  it('sets external_id to order UUID with hyphens removed', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })
    )

    await processSuccessfulCheckout('sess_4')

    const [payload] = mockCreatePrintfulOrder.mock.calls[0]
    expect(payload.external_id).toBe(CREATED_ORDER.id.replace(/-/g, ''))
    expect(payload.external_id).not.toContain('-')
  })

  // --- Core: printful_order_id saved to DB on success ---
  it('updates orders.printful_order_id when Printful returns successfully', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)

    const updateSpy = vi.fn().mockReturnValue(makeQuery({ data: null, error: null }))
    const callCounts: Record<string, number> = {}

    mockSupabase.from = vi.fn((table: string) => {
      const idx = callCounts[table] ?? 0
      callCounts[table] = idx + 1
      const responses = successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })[table as keyof ReturnType<typeof successTableResponses>]
      const result = (responses?.[idx] ?? { data: null, error: null }) as {
        data: unknown
        error: unknown
      }
      const q = makeQuery(result)
      // Spy on the orders.update call specifically
      if (table === 'orders' && idx === 2) {
        q.update = updateSpy
      }
      return q
    })

    await processSuccessfulCheckout('sess_5')

    expect(updateSpy).toHaveBeenCalledWith({ printful_order_id: 98765 })
  })

  // --- Skip: Printful configured=false ---
  it('does NOT call createOrder when isPrintfulConfigured returns false', async () => {
    const { isPrintfulConfigured } = await import('../printful')
    vi.mocked(isPrintfulConfigured).mockReturnValue(false)

    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })
    )

    const result = (await processSuccessfulCheckout('sess_6')) as Record<string, unknown>

    expect(mockCreatePrintfulOrder).not.toHaveBeenCalled()
    expect(result.ok).toBe(true) // order still created
  })

  // --- Skip: no shipping address ---
  it('does NOT call createOrder when shipping address is absent', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_NO_ADDRESS)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })
    )

    const result = (await processSuccessfulCheckout('sess_7')) as Record<string, unknown>

    expect(mockCreatePrintfulOrder).not.toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  // --- Skip: variant missing Printful IDs ---
  it('does NOT call createOrder when variant has no Printful IDs', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: null,
        printful_variant_id: null, // no Printful IDs at all
      })
    )

    const result = (await processSuccessfulCheckout('sess_8')) as Record<string, unknown>

    expect(mockCreatePrintfulOrder).not.toHaveBeenCalled()
    expect(result.ok).toBe(true) // order still created
  })

  // --- Skip: variant not found in DB ---
  it('does NOT call createOrder when variant is not found in product_variants', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock({
      ...successTableResponses({
        id: 'other-variant', // different ID — won't match 'var-1'
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      }),
      product_variants: [{ data: [], error: null }], // empty result
    })

    const result = (await processSuccessfulCheckout('sess_9')) as Record<string, unknown>

    expect(mockCreatePrintfulOrder).not.toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  // --- Non-fatal: Printful failure does NOT fail the order ---
  it('returns ok:true even when createOrder throws', async () => {
    mockCreatePrintfulOrder.mockRejectedValue(new Error('Printful API down'))
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })
    )

    const result = (await processSuccessfulCheckout('sess_10')) as Record<string, unknown>

    expect(result.ok).toBe(true)
    expect(result.orderId).toBe(CREATED_ORDER.id)
  })

  // --- Non-fatal: Printful returns { ok: false } but order still created ---
  it('returns ok:true when createOrder returns { ok: false, error: "..." }', async () => {
    mockCreatePrintfulOrder.mockResolvedValue({
      ok: false,
      error: 'Invalid recipient country',
    })
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })
    )

    const result = (await processSuccessfulCheckout('sess_11')) as Record<string, unknown>

    expect(result.ok).toBe(true)
    expect(result.orderId).toBe(CREATED_ORDER.id)
  })

  // --- email passed as recipient email ---
  it('includes guest email in Printful recipient', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(SESSION_WITH_SHIPPING)
    mockSupabase.from = buildFromMock(
      successTableResponses({
        id: 'var-1',
        printful_sync_variant_id: 1,
        printful_variant_id: null,
      })
    )

    await processSuccessfulCheckout('sess_12')

    const [payload] = mockCreatePrintfulOrder.mock.calls[0]
    expect(payload.recipient.email).toBe('buyer@example.com')
  })
})
