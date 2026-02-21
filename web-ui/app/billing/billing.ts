/** Lightweight in-browser billing module (mock Stripe flow) for S44 subscription task.
 * This is a pragmatic, testable stand-in for real Stripe integration used in the UI.
 * It provides: subscription state per user, plan upgrades, checkout session creation,
 * and simple gating logic for Free tier limits.
 */

export type Plan = 'free' | 'pro' | 'team';

export interface UserSubscription {
  userId: string;
  plan: Plan;
  // Timestamp of subscription creation (ISO string)
  createdAt: string;
}

// In-memory store for demo purposes (persists for the lifetime of the page).
const subscriptions = new Map<string, UserSubscription>();

// Simple plan ranking for upgrade checks
const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

/** Get current plan for a user (default to free if not subscribed yet) */
export function getUserPlan(userId: string): Plan {
  const sub = subscriptions.get(userId);
  return sub?.plan ?? 'free';
}

/** Set or update a user's plan (idempotent) */
export function setUserPlan(userId: string, plan: Plan): void {
  const now = new Date().toISOString();
  subscriptions.set(userId, { userId, plan, createdAt: now });
}

/** Upgrade a user's plan (idempotent) */
export function upgradeUser(userId: string, newPlan: Plan): void {
  const current = getUserPlan(userId);
  if (PLAN_RANK[newPlan] > PLAN_RANK[current]) {
    setUserPlan(userId, newPlan);
  }
}

/** Determine if a user can create a new project given current usage */
export function canCreateProject(userId: string, currentProjects: number): boolean {
  const plan = getUserPlan(userId);
  switch (plan) {
    case 'free':
      // Free tier allows up to 3 projects
      return currentProjects < 3;
    case 'pro':
    case 'team':
      // Pro and Team have no per-user project cap in this MVP
      return true;
  }
}

/** Create a mock Stripe Checkout session for upgrading the plan. */
export function createCheckoutSession(userId: string, plan: Plan): { url: string; sessionId: string } {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // A fake URL that would be redirected to in a real app
  const url = `https://checkout.mock/subscribe?user=${encodeURIComponent(userId)}&plan=${encodeURIComponent(plan)}&session=${sessionId}`;
  // In a real integration we would persist the session here; for the demo this is enough.
  return { url, sessionId };
}

/** Is an upgrade needed to reach targetPlan from current plan? */
export function isUpgradeNeeded(currentPlan: Plan, targetPlan: Plan): boolean {
  return PLAN_RANK[targetPlan] > PLAN_RANK[currentPlan];
}
