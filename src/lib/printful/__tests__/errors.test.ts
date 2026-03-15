import { describe, it, expect } from 'vitest'
import {
  PrintfulError,
  PrintfulRateLimitError,
  PrintfulAuthError,
  PrintfulNetworkError,
  PrintfulApiError,
} from '../errors'

describe('lib/printful/errors', () => {
  describe('PrintfulError', () => {
    it('creates error with message', () => {
      const err = new PrintfulError('Something went wrong')
      expect(err.message).toBe('Something went wrong')
      expect(err.name).toBe('PrintfulError')
      expect(err).toBeInstanceOf(Error)
    })

    it('creates error with message and code', () => {
      const err = new PrintfulError('Not found', 404)
      expect(err.message).toBe('Not found')
      expect(err.code).toBe(404)
    })

    it('creates error with message, code, and details', () => {
      const details = { field: 'email', reason: 'invalid' }
      const err = new PrintfulError('Validation error', 422, details)
      expect(err.details).toEqual(details)
    })
  })

  describe('PrintfulRateLimitError', () => {
    it('creates rate limit error with message', () => {
      const err = new PrintfulRateLimitError('Rate limit exceeded')
      expect(err.message).toBe('Rate limit exceeded')
      expect(err.name).toBe('PrintfulRateLimitError')
      expect(err.code).toBe(429)
      expect(err).toBeInstanceOf(PrintfulError)
    })

    it('creates rate limit error with retryAfter', () => {
      const err = new PrintfulRateLimitError('Too many requests', 60)
      expect(err.retryAfter).toBe(60)
    })
  })

  describe('PrintfulAuthError', () => {
    it('creates auth error with default message', () => {
      const err = new PrintfulAuthError()
      expect(err.message).toBe('Unauthorized')
      expect(err.name).toBe('PrintfulAuthError')
      expect(err.code).toBe(401)
      expect(err).toBeInstanceOf(PrintfulError)
    })

    it('creates auth error with custom message', () => {
      const err = new PrintfulAuthError('Invalid API key')
      expect(err.message).toBe('Invalid API key')
    })
  })

  describe('PrintfulNetworkError', () => {
    it('creates network error with message', () => {
      const err = new PrintfulNetworkError('Connection refused')
      expect(err.message).toBe('Connection refused')
      expect(err.name).toBe('PrintfulNetworkError')
      expect(err).toBeInstanceOf(PrintfulError)
    })

    it('creates network error with original error', () => {
      const originalError = new Error('ECONNREFUSED')
      const err = new PrintfulNetworkError('Network failure', originalError)
      expect(err.originalError).toBe(originalError)
    })
  })

  describe('PrintfulApiError', () => {
    it('creates API error with message and status code', () => {
      const err = new PrintfulApiError('Internal server error', 500)
      expect(err.message).toBe('Internal server error')
      expect(err.name).toBe('PrintfulApiError')
      expect(err.statusCode).toBe(500)
      expect(err.code).toBe(500)
      expect(err).toBeInstanceOf(PrintfulError)
    })

    it('creates API error with reason', () => {
      const err = new PrintfulApiError('Bad request', 400, 'INVALID_PARAMS')
      expect(err.reason).toBe('INVALID_PARAMS')
    })
  })
})
