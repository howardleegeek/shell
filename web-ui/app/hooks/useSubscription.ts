import React, { useContext, useEffect, useMemo, useState } from 'react'
import { stripeClient, type Plan } from '../lib/billing/stripe-client'

type SubscriptionState = {
  plan: Plan
  projects: number
  aiTokens: number
}

type SubscriptionContextValue = {
  state: SubscriptionState
  upgrade: (plan: Plan) => Promise<void>
}

const initialState: SubscriptionState = {
  plan: 'free',
  projects: 0,
  aiTokens: 0,
}

const SubscriptionContext = React.createContext<SubscriptionContextValue | undefined>(undefined)

// Module-scoped pending session id to correlate checkout completion with UI state
let pendingSessionId: string | null = null

export const SubscriptionProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SubscriptionState>(() => {
    try {
      const raw = localStorage.getItem('subscription_state')
      return raw ? (JSON.parse(raw) as SubscriptionState) : initialState
    } catch {
      return initialState
    }
  })

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('subscription_state', JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  // Listen for checkout completions and apply upgrades when matching the pending session
  useEffect(() => {
    const unsubscribe = stripeClient.onCheckoutComplete((sessionId, planFromCheckout) => {
      if (pendingSessionId && sessionId === pendingSessionId) {
        setState({ plan: planFromCheckout, projects: 0, aiTokens: 0 })
        pendingSessionId = null
      }
    })
    return unsubscribe
  }, [])

  const upgrade = async (plan: Plan) => {
    const session = await stripeClient.createCheckoutSession(plan)
    pendingSessionId = session.id
    // In a real app, this would redirect to Stripe Checkout. Here we just open a URL.
    try {
      window.open(session.url, '_blank')
    } catch {
      // ignore if popup blocked in test environments
    }
  }

  const value = useMemo(() => ({ state, upgrade }), [state, upgrade])
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return {
    state: ctx.state,
    upgrade: ctx.upgrade,
  }
}
