// Feature gating helpers for the subscription model

export type Plan = 'free' | 'pro'

export interface UserSubscription {
  plan: Plan
  projects: number
  aiTokens: number
}

// Free tier limits: up to 3 local projects
export function canAccessProjects(sub: UserSubscription, requestedProjects: number = 1): boolean {
  if (sub.plan === 'free') {
    return sub.projects + requestedProjects <= 3
  }
  // Pro and beyond have no project limit in this simplified model
  return true
}

// Simple helper to check if a subscription is Pro
export function isPro(sub: UserSubscription): boolean {
  return sub.plan === 'pro'
}
