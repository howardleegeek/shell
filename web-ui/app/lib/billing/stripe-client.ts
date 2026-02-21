// Lightweight mock Stripe client to support a testable subscription flow
// This module provides a minimal surface to simulate checkout sessions
// and webhook-like completion events without hitting real Stripe APIs.

export type Plan = 'free' | 'pro'

export interface CheckoutSession {
  id: string
  url: string
  plan: Plan
}

type CheckoutCompleteListener = (sessionId: string, plan: Plan) => void

class StripeClient {
  private sessions: Map<string, Plan> = new Map()
  private listeners: CheckoutCompleteListener[] = []

  // Create a mock checkout session for a given plan
  async createCheckoutSession(plan: Plan): Promise<CheckoutSession> {
    const id = `cs_${plan}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    this.sessions.set(id, plan)
    return {
      id,
      url: `https://example.com/checkout/${id}`,
      plan,
    }
  }

  // Simulate the completion of a checkout session (trigger webhook-like event)
  completeCheckout(sessionId: string): boolean {
    const plan = this.sessions.get(sessionId)
    if (!plan) return false
    this.sessions.delete(sessionId)
    this.listeners.forEach(cb => cb(sessionId, plan))
    return true
  }

  // Subscribe to checkout completion events
  onCheckoutComplete(cb: CheckoutCompleteListener): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb)
    }
  }
}

export const stripeClient = new StripeClient()
