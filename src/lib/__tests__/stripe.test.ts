import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stripe needs to be mocked as a class (constructor), not an arrow function
const mockRetrieve = vi.fn().mockResolvedValue({ id: 'cs_test_123', object: 'checkout.session' })

vi.mock('stripe', () => {
  // Use a regular function so `new Stripe()` works
  function MockStripe() {
    return { checkout: { sessions: { retrieve: mockRetrieve } } }
  }
  return { default: MockStripe }
})

describe('lib/stripe', () => {
  // Save and restore env around each test
  let savedEnv: NodeJS.ProcessEnv
  beforeEach(() => {
    savedEnv = { ...process.env }
    vi.clearAllMocks()
  })
  afterEach(() => {
    process.env = savedEnv
  })

  describe('isStripeConfigured', () => {
    it('returns true when both keys are set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_abc'
      const { isStripeConfigured } = await import('../stripe')
      expect(isStripeConfigured()).toBe(true)
    })

    it('returns false when secret key is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_abc'
      const { isStripeConfigured } = await import('../stripe')
      expect(isStripeConfigured()).toBe(false)
    })

    it('returns false when publishable key is missing', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      const { isStripeConfigured } = await import('../stripe')
      expect(isStripeConfigured()).toBe(false)
    })

    it('returns false when both keys are missing', async () => {
      delete process.env.STRIPE_SECRET_KEY
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      const { isStripeConfigured } = await import('../stripe')
      expect(isStripeConfigured()).toBe(false)
    })
  })

  describe('getStripe', () => {
    it('returns null when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY
      const { getStripe } = await import('../stripe')
      expect(getStripe()).toBeNull()
    })

    it('returns null for empty STRIPE_SECRET_KEY', async () => {
      process.env.STRIPE_SECRET_KEY = '   '
      const { getStripe } = await import('../stripe')
      expect(getStripe()).toBeNull()
    })

    it('returns a Stripe instance when key is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
      const { getStripe } = await import('../stripe')
      const result = getStripe()
      expect(result).not.toBeNull()
    })
  })

  describe('retrieveSession', () => {
    it('returns null when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY
      const { retrieveSession } = await import('../stripe')
      const result = await retrieveSession('cs_test_123')
      expect(result).toBeNull()
    })

    it('retrieves a session when configured', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
      const { retrieveSession } = await import('../stripe')
      const result = await retrieveSession('cs_test_123')
      expect(result).toMatchObject({ id: 'cs_test_123' })
    })

    it('returns null and does not throw on API error', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
      mockRetrieve.mockRejectedValueOnce(new Error('Network error'))
      const { retrieveSession } = await import('../stripe')
      const result = await retrieveSession('cs_bad_id')
      expect(result).toBeNull()
    })
  })
})
