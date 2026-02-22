import { describe, it, expect, beforeEach } from 'vitest';

import { push, pull, reset } from './gitActions';

describe('Git Push/Pull (mock)', () => {
  beforeEach(() => {
    // Reset in-memory git state before each test
    reset();
  });

  it('push should return a boolean', () => {
    const ok = push();
    expect(typeof ok).toBe('boolean');
  });

  it('pull should return a boolean', () => {
    const ok = pull();
    expect(typeof ok).toBe('boolean');
  });
});
