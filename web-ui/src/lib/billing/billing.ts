// Lightweight in-browser billing facade for the OpenApp UI.
// This module provides a tiny in-memory store for user subscriptions
// and exposes a small API surface that the rest of the UI uses to
// query state and trigger upgrades. It leverages the existing mock
// Stripe client and feature-gates utilities that already live in
// web-ui/src/lib/billing.

import type { CheckoutSession, Plan } from './stripe-client'
import { stripeClient } from './stripe-client'
import { canAccessProjects } from './feature-gates'

// Public API surface expected by the rest of the UI/tests
export type { Plan } // re-export for external consumers

export interface UserSubscription {
  plan: Plan
  projects: number
  aiTokens: number
}

// In-memory user store. In a real app this would be remote data, but
// for the purposes of tests and UI prototyping we keep it in-process.
const userStore: Record<string, UserSubscription> = {}

// Get the current subscription for a user, creating a sane default
export function getUserPlan(userId: string): UserSubscription {
  if (!userStore[userId]) {
    userStore[userId] = { plan: 'free', projects: 0, aiTokens: 0 }
  }
  return userStore[userId]
}

// Check whether a user can create another project given current usage
export function canCreateProject(userId: string, currentProjects: number): boolean {
  const sub = getUserPlan(userId)
  // Use the generic gate from the feature gates module
  return canAccessProjects({ plan: sub.plan, projects: sub.projects, aiTokens: sub.aiTokens } as any, currentProjects)
}

// Upgrade a user to a target plan (idempotent)
export function upgradeUser(userId: string, targetPlan: Plan): void {
  const sub = getUserPlan(userId)
  sub.plan = targetPlan
}

// Create a checkout session for upgrading. This delegates to the
// Stripe mock client so tests can observe the session and completion
// events without touching real Stripe.
export async function createCheckoutSession(userId: string, targetPlan: Plan): Promise<CheckoutSession> {
  // In a real app we might pass customer metadata; for tests we only care
  // about the plan being upgraded to.
  return stripeClient.createCheckoutSession(targetPlan)
}

// Determine whether upgrading to targetPlan is an actual upgrade from the
// current plan. This is a simple value-comparison heuristic suitable for tests.
export function isUpgradeNeeded(current: Plan, target: Plan): boolean {
  if (current === target) return false
  // Treat 'pro' as higher than 'free'
  if (current === 'free' && target === 'pro') return true
  // Downgrades are not treated as upgrades
  return false
}
