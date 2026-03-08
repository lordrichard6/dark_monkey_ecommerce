import { describe, it, expect, vi, beforeEach } from 'vitest'
import { subscribeToNewsletter } from '../newsletter'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

type InsertResult = { error: { code: string; message: string } | null }

function makeSupabase(insertResult: InsertResult) {
  const mockInsert = vi.fn().mockResolvedValue(insertResult)
  return {
    from: vi.fn().mockReturnValue({ insert: mockInsert }),
    _insert: mockInsert, // expose for assertions
  }
}

describe('Newsletter Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('subscribeToNewsletter', () => {
    it('returns error when email field is missing', async () => {
      const formData = new FormData()

      const result = await subscribeToNewsletter(formData)

      expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('returns error for email without @', async () => {
      const formData = new FormData()
      formData.set('email', 'notanemail')

      const result = await subscribeToNewsletter(formData)

      expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('returns error for empty string email', async () => {
      const formData = new FormData()
      formData.set('email', '')

      const result = await subscribeToNewsletter(formData)

      expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('returns success: true for valid email', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ error: null }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const formData = new FormData()
      formData.set('email', 'user@example.com')

      const result = await subscribeToNewsletter(formData)

      expect(result).toEqual({ success: true })
    })

    it('returns already-subscribed message on unique constraint violation (23505)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ error: { code: '23505', message: 'duplicate key' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const formData = new FormData()
      formData.set('email', 'existing@example.com')

      const result = await subscribeToNewsletter(formData)

      expect(result).toEqual({ success: true, message: 'Already subscribed!' })
    })

    it('returns generic error for other DB errors', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ error: { code: '500', message: 'server error' } }) as unknown as Awaited<
          ReturnType<typeof createClient>
        >
      )

      const formData = new FormData()
      formData.set('email', 'user@example.com')

      const result = await subscribeToNewsletter(formData)

      expect(result).toEqual({ error: 'Failed to subscribe' })
    })

    it('inserts into newsletter_subs with the provided email', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockReturnValue({ insert: mockInsert }),
      } as unknown as Awaited<ReturnType<typeof createClient>>)

      const formData = new FormData()
      formData.set('email', 'hello@dark-monkey.ch')

      await subscribeToNewsletter(formData)

      expect(mockInsert).toHaveBeenCalledWith([{ email: 'hello@dark-monkey.ch' }])
    })

    it('calls revalidatePath("/") on success', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { revalidatePath } = await import('next/cache')
      vi.mocked(createClient).mockResolvedValue(
        makeSupabase({ error: null }) as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const formData = new FormData()
      formData.set('email', 'user@example.com')

      await subscribeToNewsletter(formData)

      expect(revalidatePath).toHaveBeenCalledWith('/')
    })

    it('does not call DB when email is invalid', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = makeSupabase({ error: null })
      vi.mocked(createClient).mockResolvedValue(
        supabase as unknown as Awaited<ReturnType<typeof createClient>>
      )

      const formData = new FormData()
      formData.set('email', 'bademail')

      await subscribeToNewsletter(formData)

      // createClient should not even be called for invalid emails
      expect(createClient).not.toHaveBeenCalled()
    })
  })
})
