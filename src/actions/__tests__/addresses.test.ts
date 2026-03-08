import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressFormData,
} from '../addresses'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockUser = { id: 'user-1', email: 'test@example.com' }

const validAddress: AddressFormData = {
  type: 'shipping',
  full_name: 'John Doe',
  line1: '123 Main St',
  city: 'Zürich',
  postal_code: '8001',
  country: 'CH',
  is_default: false,
}

type TerminalResult = { error: { message: string } | null; data?: unknown }

function makeQueryBuilder(terminalResult: TerminalResult) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue(terminalResult),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(terminalResult),
    then: (resolve: (v: TerminalResult) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(terminalResult).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(terminalResult).catch(reject),
  }
  return builder
}

function makeSupabase(user: typeof mockUser | null, queryResult: TerminalResult = { error: null }) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(makeQueryBuilder(queryResult)),
  }
}

describe('Addresses Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── addAddress ─────────────────────────────────────────────────────────────
  describe('addAddress', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await addAddress(validAddress)
      expect(result).toEqual({ ok: false, error: 'Unauthorized' })
    })

    it('returns ok: true on successful insert', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await addAddress(validAddress)
      expect(result).toEqual({ ok: true })
    })

    it('returns validation error for missing full_name', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const badData = { ...validAddress, full_name: '' }
      const result = await addAddress(badData)
      expect(result.ok).toBe(false)
      expect((result as { ok: false; error: string }).error).toBeTruthy()
    })

    it('returns validation error for invalid type', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const badData = { ...validAddress, type: 'invalid' as AddressFormData['type'] }
      const result = await addAddress(badData)
      expect(result.ok).toBe(false)
    })

    it('returns error when DB insert fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'Insert failed' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await addAddress(validAddress)
      expect(result).toEqual({ ok: false, error: 'Insert failed' })
    })

    it('clears other default addresses when is_default is true', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase(mockUser)
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await addAddress({ ...validAddress, is_default: true })

      // Should call update on addresses to clear defaults first
      expect(supabase.from).toHaveBeenCalledWith('addresses')
      const builder = supabase.from.mock.results[0].value
      expect(builder.update).toHaveBeenCalledWith({ is_default: false })
    })

    it('does not clear other defaults when is_default is false', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase(mockUser)
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await addAddress({ ...validAddress, is_default: false })

      const builder = supabase.from.mock.results[0].value
      // update should not have been called (only insert)
      expect(builder.update).not.toHaveBeenCalled()
    })

    it('calls revalidatePath after success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await addAddress(validAddress)
      expect(revalidatePath).toHaveBeenCalledWith('/account/addresses')
    })
  })

  // ── updateAddress ──────────────────────────────────────────────────────────
  describe('updateAddress', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await updateAddress('addr-1', validAddress)
      expect(result).toEqual({ ok: false, error: 'Unauthorized' })
    })

    it('returns ok: true on successful update', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await updateAddress('addr-1', validAddress)
      expect(result).toEqual({ ok: true })
    })

    it('returns validation error for empty city', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await updateAddress('addr-1', { ...validAddress, city: '' })
      expect(result.ok).toBe(false)
    })

    it('returns error when DB update fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'Update failed' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await updateAddress('addr-1', validAddress)
      expect(result).toEqual({ ok: false, error: 'Update failed' })
    })
  })

  // ── deleteAddress ──────────────────────────────────────────────────────────
  describe('deleteAddress', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await deleteAddress('addr-1')
      expect(result).toEqual({ ok: false, error: 'Unauthorized' })
    })

    it('returns ok: true on success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await deleteAddress('addr-1')
      expect(result).toEqual({ ok: true })
    })

    it('returns error when DB delete fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'Delete error' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await deleteAddress('addr-1')
      expect(result).toEqual({ ok: false, error: 'Delete error' })
    })

    it('deletes only addresses belonging to the current user', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase(mockUser)
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await deleteAddress('addr-42')

      const builder = supabase.from.mock.results[0].value
      expect(builder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(builder.eq).toHaveBeenCalledWith('id', 'addr-42')
    })
  })

  // ── setDefaultAddress ──────────────────────────────────────────────────────
  describe('setDefaultAddress', () => {
    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(null) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await setDefaultAddress('addr-1', 'shipping')
      expect(result).toEqual({ ok: false, error: 'Unauthorized' })
    })

    it('returns ok: true on success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const result = await setDefaultAddress('addr-1', 'shipping')
      expect(result).toEqual({ ok: true })
    })

    it('returns error when DB update fails', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser, { error: { message: 'Set default failed' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const result = await setDefaultAddress('addr-1', 'billing')
      expect(result).toEqual({ ok: false, error: 'Set default failed' })
    })

    it('calls revalidatePath after success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase(mockUser) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      await setDefaultAddress('addr-1', 'shipping')
      expect(revalidatePath).toHaveBeenCalledWith('/account/addresses')
    })
  })
})
