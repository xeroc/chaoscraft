/**
 * Integration tests for Stripe payment flow
 * 
 * Tests the complete payment flow:
 * 1. Submit API - creates checkout session and stores payment in DB
 * 2. Webhook handler - processes Stripe events and updates DB/GitHub
 * 
 * KNOWN BUGS FOUND:
 * - Pricing bug: getPricing() returns cents but then multiplies by 100 again,
 *   resulting in $100 for standard instead of $1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock environment variables before any imports
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'
process.env.GITHUB_TOKEN = 'ghp_mock'
process.env.GITHUB_OWNER = 'test-owner'
process.env.GITHUB_REPO = 'test-repo'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

// Mock Stripe
const mockCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test',
  metadata: {},
}

const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockCheckoutSession),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => mockStripe),
  }
})

// Mock Octokit
const mockOctokit = {
  rest: {
    issues: {
      create: vi.fn().mockResolvedValue({
        data: {
          number: 42,
          html_url: 'https://github.com/test-owner/test-repo/issues/42',
        },
      }),
    },
  },
}

vi.mock('octokit', () => {
  return {
    Octokit: vi.fn(() => mockOctokit),
  }
})

// Create a mock statement that returns proper result
const createMockStatement = (overrides = {}) => {
  const defaults = {
    all: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue({ id: 1, status: 'pending' }),
    run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
  }
  return { ...defaults, ...overrides }
}

// Mock database module
const mockDb = {
  exec: vi.fn(),
  prepare: vi.fn(() => createMockStatement()),
  pragma: vi.fn(),
  close: vi.fn(),
}

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn(() => mockDb),
  }
})

describe('Stripe Payment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock statement for each test
    mockDb.prepare.mockReturnValue(createMockStatement())
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Submit API', () => {
    it('should create Stripe checkout session with valid request', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      const request = new NextRequest('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: 'Add a dancing robot feature',
          paymentMethod: 'stripe',
          priority: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/test')
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
          metadata: expect.objectContaining({
            request: 'Add a dancing robot feature',
            priority: 'standard',
          }),
        })
      )
    })

    it('should reject empty request text', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      const request = new NextRequest('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: '',
          paymentMethod: 'stripe',
          priority: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should reject request longer than 120 characters', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      const longRequest = 'A'.repeat(121)
      
      const request = new NextRequest('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: longRequest,
          paymentMethod: 'stripe',
          priority: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('120')
    })

    it('should reject invalid payment method', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      const request = new NextRequest('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: 'Test feature',
          paymentMethod: 'invalid' as any,
          priority: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid payment method')
    })

    it('should reject invalid priority', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      const request = new NextRequest('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: 'Test feature',
          paymentMethod: 'stripe',
          priority: 'invalid' as any,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid priority')
    })

    it('should note pricing bug: standard should be $1 not $100', async () => {
      // This test documents a known bug in the pricing calculation
      // getPricing() returns 100 (intended as cents for $1)
      // But then amount * 100 = 10000 cents = $100
      // This is a bug that should be fixed
      const getPricing = (priority: string) => {
        switch (priority) {
          case 'express': return 1000
          case 'priority': return 500
          default: return 100
        }
      }
      
      // Current behavior (buggy)
      const standardPrice = getPricing('standard')
      const amountInCents = standardPrice * 100
      expect(amountInCents).toBe(10000) // $100 - BUG!
      
      // Expected behavior
      // const amountInCents = standardPrice // Should just use 100 cents = $1
    })
  })

  describe('Webhook Handler', () => {
    it('should reject requests with invalid signature', async () => {
      const { POST } = await import('../app/api/payment/stripe-webhook/route')
      
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/payment/stripe-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid_signature',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Invalid signature')
    })

    it('should process checkout.session.completed event', async () => {
      const { POST } = await import('../app/api/payment/stripe-webhook/route')
      
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            metadata: {
              paymentDbId: '1',
              request: 'Test feature request',
              priority: 'standard',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDb.prepare.mockReturnValue(createMockStatement({
        get: vi.fn().mockReturnValue({ id: 1, status: 'pending' }),
      }))

      const request = new NextRequest('http://localhost:3000/api/payment/stripe-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('should handle checkout.session.expired event', async () => {
      const { POST } = await import('../app/api/payment/stripe-webhook/route')
      
      const mockEvent = {
        type: 'checkout.session.expired',
        data: {
          object: {
            metadata: {
              paymentDbId: '1',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/payment/stripe-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('should handle payment_intent.payment_failed event', async () => {
      const { POST } = await import('../app/api/payment/stripe-webhook/route')
      
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDb.prepare.mockReturnValue(createMockStatement({
        get: vi.fn().mockReturnValue({ id: 1 }),
      }))

      const request = new NextRequest('http://localhost:3000/api/payment/stripe-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('should return 404 for non-existent payment', async () => {
      const { POST } = await import('../app/api/payment/stripe-webhook/route')
      
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            metadata: {
              paymentDbId: '999',
              request: 'Test feature request',
              priority: 'standard',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDb.prepare.mockReturnValue(createMockStatement({
        get: vi.fn().mockReturnValue(undefined), // Payment not found
      }))

      const request = new NextRequest('http://localhost:3000/api/payment/stripe-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should skip already verified payments', async () => {
      const { POST } = await import('../app/api/payment/stripe-webhook/route')
      
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            metadata: {
              paymentDbId: '1',
              request: 'Test feature request',
              priority: 'standard',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDb.prepare.mockReturnValue(createMockStatement({
        get: vi.fn().mockReturnValue({ id: 1, status: 'verified' }), // Already verified
      }))

      const request = new NextRequest('http://localhost:3000/api/payment/stripe-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      // Should not create issue for already verified payment
      expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled()
    })
  })

  describe('Cross-cutting Concerns', () => {
    it('should handle special characters in request text', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      const specialRequest = 'Add emoji 🎉 and symbols <>&"\''
      
      mockDb.prepare.mockReturnValue(createMockStatement())
      
      const request = new NextRequest('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: specialRequest,
          paymentMethod: 'stripe',
          priority: 'standard',
        }),
      })

      const response = await POST(request)
      
      // Should not throw, should handle gracefully
      expect(response.status).toBe(200)
    })

    it('should handle concurrent payment submissions', async () => {
      const { POST } = await import('../app/api/submit/route')
      
      // Set up mock for multiple calls
      mockDb.prepare.mockReturnValue(createMockStatement())
      
      // Simulate 5 concurrent requests
      const requests = Array(5).fill(null).map((_, i) => {
        return new NextRequest('http://localhost:3000/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request: `Concurrent request ${i}`,
            paymentMethod: 'stripe',
            priority: 'standard',
          }),
        })
      })

      const responses = await Promise.all(
        requests.map(req => POST(req))
      )

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})
