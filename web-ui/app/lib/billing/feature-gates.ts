// Feature gating helpers for the subscription model

export type Plan = 'free' | 'pro' | 'team'

// Simple helper to determine if a plan is Pro-level (or higher)
export const isPro = (plan: Plan): boolean => plan === 'pro' || plan === 'team'

// Determine whether a user on a given plan can create another project
export const canCreateProject = (plan: Plan, currentProjects: number): boolean => {
  switch (plan) {
    case 'free':
      // Free tier allows up to 3 projects
      return currentProjects < 3
    case 'pro':
    case 'team':
      // Pro and Team have no per-user project cap in this MVP
      return true
  }
}
