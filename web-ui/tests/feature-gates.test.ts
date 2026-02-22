import { describe, it, expect } from 'vitest'
import { canAccessProjects, isPro } from '../src/lib/billing/feature-gates'
import type { UserSubscription } from '../src/lib/billing/feature-gates'

describe('Feature gates', () => {
  it('free tier project limits', () => {
    const subFree: UserSubscription = { plan: 'free', projects: 0, aiTokens: 0 }
    expect(canAccessProjects(subFree, 3)).toBe(true) // exactly at limit
    expect(canAccessProjects(subFree, 4)).toBe(false)

    const subFree2: UserSubscription = { plan: 'free', projects: 2, aiTokens: 0 }
    expect(canAccessProjects(subFree2, 1)).toBe(true)
    expect(canAccessProjects(subFree2, 2)).toBe(false)
  })

  it('pro tier has no project limit', () => {
    const subPro: UserSubscription = { plan: 'pro', projects: 999, aiTokens: 0 }
    expect(canAccessProjects(subPro, 1000)).toBe(true)
  })

  it('isPro helper', () => {
    expect(isPro({ plan: 'free', projects: 0, aiTokens: 0 })).toBe(false)
    expect(isPro({ plan: 'pro', projects: 0, aiTokens: 0 })).toBe(true)
  })
})
