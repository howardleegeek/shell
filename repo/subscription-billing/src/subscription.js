// Minimal in-memory subscription service with Stripe-like checkout flow (mock)
// - Free tier: up to 3 projects
// - Pro tier: unlocks unlimited projects
// - Simulated Stripe Checkout sessions and a webhook handler to upgrade plans

export class SubscriptionService {
  constructor() {
    this.users = new Map(); // userId -> { plan: 'free'|'pro', projects: number, status: 'active' }
    this.sessions = new Map(); // sessionId -> { userId, plan, url }
  }

  ensureUser(userId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, { plan: 'free', projects: 0, status: 'active' });
    }
    return this.users.get(userId);
  }

  getCurrentPlan(userId) {
    const u = this.users.get(userId);
    return u ? u.plan : null;
  }

  // Pricing metadata for external UI
  getPricing(plan) {
    if (plan === 'free') {
      return { price: 0, projectsLimit: 3 };
    }
    if (plan === 'pro') {
      return { price: 19, projectsLimit: Infinity };
    }
    return { price: 0, projectsLimit: 0 };
  }

  canAddProjects(userId, count = 1) {
    const u = this.users.get(userId);
    if (!u) return false;
    const pricing = this.getPricing(u.plan);
    const limit = pricing.projectsLimit;
    const next = u.projects + count;
    if (limit === Infinity) return true;
    return next <= limit;
  }

  addProject(userId) {
    const u = this.ensureUser(userId);
    if (!this.canAddProjects(userId, 1)) {
      throw new Error('Project limit reached for current plan');
    }
    u.projects += 1;
    return u.projects;
  }

  // Create a mock Stripe Checkout session for upgrading to Pro
  createCheckoutSession(userId, plan) {
    if (plan !== 'pro') throw new Error('Only Pro plan upgrade is supported in mock');
    this.ensureUser(userId);
    const sessionId = 'sess_' + Math.random().toString(36).slice(2, 12);
    const url = `https://checkout.fake/checkout?session_id=${sessionId}`;
    this.sessions.set(sessionId, { userId, plan, url, createdAt: Date.now() });
    return { id: sessionId, url };
  }

  // Webhook handler for Stripe-like events (mock)
  handleWebhook(event) {
    // Expected: { type: 'checkout.session.completed', data: { object: { metadata: { userId, plan } } } }
    if (!event || !event.type || !event.data) {
      throw new Error('Invalid webhook event');
    }
    if (event.type === 'checkout.session.completed') {
      const sess = event.data.object;
      const metadata = sess && sess.metadata ? sess.metadata : {};
      const { userId, plan } = metadata;
      if (!userId || !plan) {
        throw new Error('Invalid webhook payload: missing metadata');
      }
      // Upgrade the user plan
      this.ensureUser(userId);
      const u = this.users.get(userId);
      u.plan = plan;
      // Clear any related session if present
      // Find and remove the session entry using the id in sess.id if available
      const sid = sess.id;
      if (sid && this.sessions.has(sid)) this.sessions.delete(sid);
      return { userId, newPlan: plan };
    }
    // Other events are ignored in this mock
    return { ok: true };
  }
}

export default SubscriptionService;
