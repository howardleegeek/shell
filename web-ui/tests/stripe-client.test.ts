import { describe, it, expect, afterEach } from 'vitest'
import { stripeClient, type Plan } from '../src/lib/billing/stripe-client'

describe('StripeClient mock', () => {
  afterEach(() => {
    // no global state to reset in this mock, but keep hook clean
  })

  it('creates and completes a checkout session and notifies listener', () => {
    let receivedSessionId: string | null = null
    let receivedPlan: Plan | null = null

    const unsubscribe = stripeClient.onCheckoutComplete((sessionId, plan) => {
      receivedSessionId = sessionId
      receivedPlan = plan
    })

    // Create a checkout session for Pro plan
    // The function is async but we can await in vitest test
    return stripeClient.createCheckoutSession('pro').then(session => {
      expect(session.plan).toBe('pro')
      // Complete the checkout synchronously
      const ok = stripeClient.completeCheckout(session.id)
      expect(ok).toBe(true)
      expect(receivedSessionId).toBe(session.id)
      expect(receivedPlan).toBe('pro')
      unsubscribe()
    })
  })

  it('completing a nonexistent session returns false', () => {
    const ok = stripeClient.completeCheckout('nonexistent')
    expect(ok).toBe(false)
  })
})
