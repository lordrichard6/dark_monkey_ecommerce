import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getShippingZones,
  getFreeShippingThreshold,
  updateShippingZone,
  getStoreSetting,
  updateStoreSetting,
  updateFreeShippingThreshold,
} from '../admin-shipping'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockUpsert = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

const mockSupabase = {
  from: mockFrom,
}

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth-admin', () => ({
  getAdminUser: vi.fn(),
}))

vi.mock('@/lib/shipping', () => ({
  SHIPPING_ZONES: [
    { name: 'Switzerland', countries: ['CH'], firstItemCents: 790, additionalItemCents: 290 },
    { name: 'Europe', countries: ['PT', 'DE'], firstItemCents: 890, additionalItemCents: 350 },
  ],
  FREE_SHIPPING_THRESHOLD_CENTS: 10000,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupSupabaseChain({
  data = null,
  error = null,
}: { data?: unknown; error?: unknown } = {}) {
  mockSingle.mockResolvedValue({ data, error })
  mockOrder.mockResolvedValue({ data, error })
  // For select chains: eq returns { single, order }
  mockEq.mockReturnValue({ single: mockSingle, order: mockOrder })
  mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq })
  // For update chains: eq is awaited directly — must return a Promise
  mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error }) })
  mockUpsert.mockResolvedValue({ data, error })
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
    upsert: mockUpsert,
  })
}

// ─── getShippingZones ─────────────────────────────────────────────────────────

describe('getShippingZones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hardcoded defaults when admin client is unavailable', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminClient).mockReturnValue(null as never)

    const zones = await getShippingZones()
    expect(zones).toHaveLength(2)
    expect(zones[0].name).toBe('Switzerland')
    expect(zones[0].id).toBe('switzerland')
    expect(zones[0].countries).toContain('CH')
  })

  it('falls back to defaults when DB returns an error', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ error: { message: 'DB error' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const zones = await getShippingZones()
    expect(zones[0].name).toBe('Switzerland')
  })

  it('falls back to defaults when DB returns empty array', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ data: [] })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const zones = await getShippingZones()
    expect(zones[0].name).toBe('Switzerland')
  })

  it('returns DB rows when available', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    const dbZones = [
      {
        id: 'ch',
        name: 'Switzerland',
        countries: ['CH'],
        first_item_cents: 800,
        additional_item_cents: 300,
        sort_order: 1,
      },
    ]
    setupSupabaseChain({ data: dbZones })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const zones = await getShippingZones()
    expect(zones).toEqual(dbZones)
  })
})

// ─── getFreeShippingThreshold ─────────────────────────────────────────────────

describe('getFreeShippingThreshold', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hardcoded default when admin client is unavailable', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminClient).mockReturnValue(null as never)

    const threshold = await getFreeShippingThreshold()
    expect(threshold).toBe(10000)
  })

  it('returns parsed value from DB when valid', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ data: { value: '15000' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const threshold = await getFreeShippingThreshold()
    expect(threshold).toBe(15000)
  })

  it('returns default when DB value is not a number', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ data: { value: 'not-a-number' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const threshold = await getFreeShippingThreshold()
    expect(threshold).toBe(10000)
  })

  it('returns default when DB returns no data', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ data: null })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const threshold = await getFreeShippingThreshold()
    expect(threshold).toBe(10000)
  })
})

// ─── updateShippingZone ───────────────────────────────────────────────────────

describe('updateShippingZone', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when no admin user', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    vi.mocked(getAdminUser).mockResolvedValue(null as never)

    const result = await updateShippingZone('zone-1', 800, 300)
    expect(result).toEqual({ ok: false, error: 'Unauthorized' })
  })

  it('returns error when admin client is unavailable', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    vi.mocked(getAdminClient).mockReturnValue(null as never)

    const result = await updateShippingZone('zone-1', 800, 300)
    expect(result).toEqual({ ok: false, error: 'Admin not configured' })
  })

  it('returns error when prices are negative', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateShippingZone('zone-1', -100, 300)
    expect(result).toEqual({ ok: false, error: 'Prices cannot be negative' })
  })

  it('returns error when additional item price is negative', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateShippingZone('zone-1', 800, -50)
    expect(result).toEqual({ ok: false, error: 'Prices cannot be negative' })
  })

  it('returns error on DB failure', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    const { revalidatePath } = await import('next/cache')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: { message: 'DB write error' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateShippingZone('zone-1', 800, 300)
    expect(result).toEqual({ ok: false, error: 'DB write error' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns ok and revalidates on success', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    const { revalidatePath } = await import('next/cache')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: null })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateShippingZone('zone-1', 800, 300)
    expect(result).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shipping')
  })
})

// ─── getStoreSetting ──────────────────────────────────────────────────────────

describe('getStoreSetting', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when admin client unavailable', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminClient).mockReturnValue(null as never)

    const val = await getStoreSetting('some_key')
    expect(val).toBeNull()
  })

  it('returns value from DB', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ data: { value: 'hello' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const val = await getStoreSetting('some_key')
    expect(val).toBe('hello')
  })

  it('returns null when DB has no data', async () => {
    const { getAdminClient } = await import('@/lib/supabase/admin')
    setupSupabaseChain({ data: null })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const val = await getStoreSetting('missing_key')
    expect(val).toBeNull()
  })
})

// ─── updateStoreSetting ───────────────────────────────────────────────────────

describe('updateStoreSetting', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when no admin user', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    vi.mocked(getAdminUser).mockResolvedValue(null as never)

    const result = await updateStoreSetting('key', 'value')
    expect(result).toEqual({ ok: false, error: 'Unauthorized' })
  })

  it('returns error when admin client unavailable', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    vi.mocked(getAdminClient).mockReturnValue(null as never)

    const result = await updateStoreSetting('key', 'value')
    expect(result).toEqual({ ok: false, error: 'Admin not configured' })
  })

  it('returns error on DB failure', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: { message: 'upsert failed' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateStoreSetting('key', 'value')
    expect(result).toEqual({ ok: false, error: 'upsert failed' })
  })

  it('returns ok and revalidates on success', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    const { revalidatePath } = await import('next/cache')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: null })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateStoreSetting('key', 'new_value')
    expect(result).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/settings')
  })
})

// ─── updateFreeShippingThreshold ──────────────────────────────────────────────

describe('updateFreeShippingThreshold', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when no admin user', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    vi.mocked(getAdminUser).mockResolvedValue(null as never)

    const result = await updateFreeShippingThreshold(5000)
    expect(result).toEqual({ ok: false, error: 'Unauthorized' })
  })

  it('returns error when admin client unavailable', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    vi.mocked(getAdminClient).mockReturnValue(null as never)

    const result = await updateFreeShippingThreshold(5000)
    expect(result).toEqual({ ok: false, error: 'Admin not configured' })
  })

  it('returns error when threshold is negative', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateFreeShippingThreshold(-1)
    expect(result).toEqual({ ok: false, error: 'Threshold cannot be negative' })
  })

  it('returns error on DB failure', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: { message: 'write error' } })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateFreeShippingThreshold(5000)
    expect(result).toEqual({ ok: false, error: 'write error' })
  })

  it('returns ok and revalidates on success', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    const { revalidatePath } = await import('next/cache')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: null })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateFreeShippingThreshold(5000)
    expect(result).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shipping')
  })

  it('accepts zero as a valid threshold', async () => {
    const { getAdminUser } = await import('@/lib/auth-admin')
    const { getAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getAdminUser).mockResolvedValue({ id: 'admin-1' } as never)
    setupSupabaseChain({ error: null })
    vi.mocked(getAdminClient).mockReturnValue(mockSupabase as never)

    const result = await updateFreeShippingThreshold(0)
    expect(result).toEqual({ ok: true })
  })
})
