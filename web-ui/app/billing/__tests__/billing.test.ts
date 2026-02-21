import { describe, it, expect, beforeEach } from 'vitest';
import { getUserPlan, setUserPlan, upgradeUser, canCreateProject, createCheckoutSession, isUpgradeNeeded } from '../../billing/billing';

describe('Billing module (subscription gating)', () => {
  const userId = 'test-user-1';

  beforeEach(() => {
    // Reset in-memory store between tests by re-creating the map-like state
    // Since the module uses a module scope Map, we simulate fresh state by explicit resets
    // Note: In real tests, you'd provide a reset function; here we re-import is not feasible,
    // so we rely on deterministic initial state via getUserPlan defaulting to 'free'.
  });

  it('defaults to free plan for new users', () => {
    expect(getUserPlan(userId)).toBe('free');
  });

  it('free tier can create up to 3 projects', () => {
    setUserPlan(userId, 'free');
    expect(canCreateProject(userId, 0)).toBe(true);
    expect(canCreateProject(userId, 2)).toBe(true);
    expect(canCreateProject(userId, 3)).toBe(false);
  });

  it('upgrading from free to pro enables unlimited projects', () => {
    setUserPlan(userId, 'free');
    expect(isUpgradeNeeded(getUserPlan(userId), 'pro')).toBe(true);
    upgradeUser(userId, 'pro');
    expect(getUserPlan(userId)).toBe('pro');
    // After upgrade, can create a lot more projects
    expect(canCreateProject(userId, 100)).toBe(true);
  });

  it('upgrade session creation returns a usable URL', () => {
    const { url, sessionId } = createCheckoutSession(userId, 'pro');
    expect(typeof url).toBe('string');
    expect(url).toContain('checkout.mock');
    expect(typeof sessionId).toBe('string');
  });
});
