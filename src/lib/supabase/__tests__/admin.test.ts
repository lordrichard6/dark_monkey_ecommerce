import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCreateClient = vi.fn().mockReturnValue({ auth: {}, from: vi.fn() })

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

describe('lib/supabase/admin', () => {
  let savedEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    savedEnv = { ...process.env }
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    process.env = savedEnv
  })

  describe('getAdminClient', () => {
    it('returns null when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
      const { getAdminClient } = await import('../admin')
      expect(getAdminClient()).toBeNull()
    })

    it('returns null when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      const { getAdminClient } = await import('../admin')
      expect(getAdminClient()).toBeNull()
    })

    it('returns null when both env vars are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      const { getAdminClient } = await import('../admin')
      expect(getAdminClient()).toBeNull()
    })

    it('returns a client when both env vars are set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
      const { getAdminClient } = await import('../admin')
      const result = getAdminClient()
      expect(result).not.toBeNull()
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'service-role-key'
      )
    })

    it('trims whitespace from env vars', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '  https://project.supabase.co  '
      process.env.SUPABASE_SERVICE_ROLE_KEY = '  service-role-key  '
      const { getAdminClient } = await import('../admin')
      getAdminClient()
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'service-role-key'
      )
    })

    it('returns null when env vars are only whitespace', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '   '
      process.env.SUPABASE_SERVICE_ROLE_KEY = '   '
      const { getAdminClient } = await import('../admin')
      expect(getAdminClient()).toBeNull()
    })
  })
})
