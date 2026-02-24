import { useEffect, useState } from 'react';

// Simple subscription model kept in localStorage for demonstration
export type Plan = 'free' | 'pro';
export type SubscriptionInfo = {
  plan: Plan;
  canAccess: (feature: string) => boolean;
};

const STORAGE_KEY = 'subscription.plan';

function loadInitialPlan(): Plan {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'free' || v === 'pro') return v;
  } catch {
    // ignore
  }
  return 'free';
}

/**
 * Minimal, idempotent subscription hook.
 * - Persists plan in localStorage
 * - Provides a canAccess helper for simple feature gating
 */
export function useSubscription(): [SubscriptionInfo, (to: Plan) => void] {
  const [plan, setPlan] = useState<Plan>(() => loadInitialPlan());

  const upgrade = (to: Plan) => {
    if (to !== 'free' && to !== 'pro') return;
    setPlan(to);
    try {
      localStorage.setItem(STORAGE_KEY, to);
    } catch {
      // ignore write errors in test/dev environments
    }
  };

  const info: SubscriptionInfo = {
    plan,
    canAccess: (feature: string) => {
      // Pro unlocks all features; free is restricted
      if (plan === 'pro') return true;
      // Free tier only allows a basic feature set
      return feature === 'basic';
    },
  };

  // Ensure object reference stability for consumers
  return [info, upgrade];
}
