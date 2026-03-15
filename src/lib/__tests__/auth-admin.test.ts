/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}))

describe('lib/auth-admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAdminUser', () => {
    it('returns null when getUser throws an error', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Network error')),
        },
        from: vi.fn(),
      } as any)

      const { getAdminUser } = await import('../auth-admin')
      const result = await getAdminUser()
      expect(result).toBeNull()
    })

    it('returns null when no user is authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { getAdminClient } = await import('@/lib/supabase/admin')

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      } as any)
      vi.mocked(getAdminClient).mockReturnValue(null)

      const { getAdminUser } = await import('../auth-admin')
      const result = await getAdminUser()
      expect(result).toBeNull()
    })

    it('returns null when user profile is not admin', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { getAdminClient } = await import('@/lib/supabase/admin')

      const mockSingle = vi.fn().mockResolvedValue({ data: { is_admin: false } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'user@example.com' } },
          }),
        },
        from: mockFrom,
      } as any)
      vi.mocked(getAdminClient).mockReturnValue(null)

      const { getAdminUser } = await import('../auth-admin')
      const result = await getAdminUser()
      expect(result).toBeNull()
    })

    it('returns null when profile is null', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { getAdminClient } = await import('@/lib/supabase/admin')

      const mockSingle = vi.fn().mockResolvedValue({ data: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'user@example.com' } },
          }),
        },
        from: mockFrom,
      } as any)
      vi.mocked(getAdminClient).mockReturnValue(null)

      const { getAdminUser } = await import('../auth-admin')
      const result = await getAdminUser()
      expect(result).toBeNull()
    })

    it('returns user when is_admin is true (using session client)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { getAdminClient } = await import('@/lib/supabase/admin')

      const mockUser = { id: 'admin-123', email: 'admin@example.com' }
      const mockSingle = vi.fn().mockResolvedValue({ data: { is_admin: true } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: mockFrom,
      } as any)
      vi.mocked(getAdminClient).mockReturnValue(null) // no service role

      const { getAdminUser } = await import('../auth-admin')
      const result = await getAdminUser()
      expect(result).toEqual(mockUser)
    })

    it('returns user when is_admin is true (using admin client)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { getAdminClient } = await import('@/lib/supabase/admin')

      const mockUser = { id: 'admin-123', email: 'admin@example.com' }
      const mockSingle = vi.fn().mockResolvedValue({ data: { is_admin: true } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockAdminFrom = vi.fn().mockReturnValue({ select: mockSelect })

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn(), // session client from (not used when admin client exists)
      } as any)

      vi.mocked(getAdminClient).mockReturnValue({
        from: mockAdminFrom,
      } as any)

      const { getAdminUser } = await import('../auth-admin')
      const result = await getAdminUser()
      expect(result).toEqual(mockUser)
      // Admin client's from() should have been called
      expect(mockAdminFrom).toHaveBeenCalledWith('user_profiles')
    })
  })
})
