// Lightweight tests for the in-memory subscription service
import assert from 'assert';
import { SubscriptionService } from '../src/subscription.js';

const run = async () => {
  const svc = new SubscriptionService();
  const user = 'alice';

  // Initially user should exist with Free plan
  svc.ensureUser(user);
  assert.strictEqual(svc.getCurrentPlan(user), 'free', 'Initial plan should be free');

  // Free tier limit: 3 projects
  svc.addProject(user);
  svc.addProject(user);
  svc.addProject(user);
  let threw = false;
  try {
    svc.addProject(user);
  } catch (e) {
    threw = true;
  }
  assert.strictEqual(threw, true, 'Should not allow more than 3 projects on free tier');

  // Create a Pro checkout session for upgrade
  const session = svc.createCheckoutSession(user, 'pro');
  assert.ok(session.url.startsWith('https://checkout.fake/checkout'), 'Checkout URL should be mocked');

  // Simulate Stripe webhook: checkout.session.completed with metadata
  const webhookEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: session.id,
        metadata: {
          userId: user,
          plan: 'pro'
        }
      }
    }
  };

  const result = svc.handleWebhook(webhookEvent);
  assert.strictEqual(result.newPlan, 'pro', 'Webhook should upgrade plan to pro');
  assert.strictEqual(svc.getCurrentPlan(user), 'pro', 'User should be on pro plan after webhook');

  // Pro plan allows unlimited projects
  let ran = true;
  for (let i = 0; i < 50; i++) {
    svc.addProject(user);
  }
  assert.ok(true, 'Pro plan should allow many projects without error');
  return ran ? 'ok' : 'fail';
};

run().then((status) => {
  console.log('PASS: subscription.test.js');
  process.exit(0);
}).catch((err) => {
  console.error('FAIL: subscription.test.js', err);
  process.exit(1);
});
