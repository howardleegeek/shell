// Lightweight React hook wrapping the in-browser billing module
// Provides a small, testable abstraction over the mock billing.ts
// to enable UI components to query plan state and trigger upgrades.

import type { Plan } from '../billing/billing';
import {
  getUserPlan,
  canCreateProject,
  upgradeUser,
  createCheckoutSession,
  isUpgradeNeeded,
} from '../billing/billing';

/**
 * Hook signature:
 * - userId: unique user identifier
 * - currentProjects: number of projects user currently owns (used for gating in UI)
 *
 * Returns:
 * - plan: current plan for the user
 * - canCreate: whether the user can create another project under the current plan
 * - upgrade(targetPlan): upgrade the user to a higher plan (idempotent)
 * - createCheckout(targetPlan): create a mock checkout session for upgrading
 * - isUpgradeNeeded(targetPlan): whether upgrading to targetPlan is an upgrade from current plan
 */
export function useSubscription(userId: string, currentProjects: number) {
  // State object representing the user's subscription
  const state = getUserPlan(userId)
  const canCreate = canCreateProject(userId, currentProjects)

  const upgrade = (targetPlan: Plan) => {
    upgradeUser(userId, targetPlan)
  }

  const createCheckout = (targetPlan: Plan) => {
    return createCheckoutSession(userId, targetPlan)
  }

  const isUpgrade = (targetPlan: Plan) => isUpgradeNeeded(state.plan, targetPlan)

  return {
    state,
    canCreate,
    upgrade,
    createCheckout,
    isUpgrade,
  }
}

export type { Plan };
