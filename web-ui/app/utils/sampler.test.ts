import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSampler } from './sampler';

describe('createSampler', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns a callable sampler with dispose()', () => {
    const sampler = createSampler(() => {}, 10);
    expect(typeof sampler).toBe('function');
    expect(typeof sampler.dispose).toBe('function');
  });

  it('does not execute pending callback after dispose()', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const sampler = createSampler(fn, 50);

    sampler();
    sampler.dispose();
    vi.advanceTimersByTime(60);

    expect(fn).not.toHaveBeenCalled();
  });

  it('forwards callback errors to the global error path', () => {
    vi.useFakeTimers();
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);

    const thrown = new Error('sampler failed');
    const sampler = createSampler(() => {
      throw thrown;
    }, 20);

    sampler();
    vi.advanceTimersByTime(20);

    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(thrown);
  });

  it('keeps provided context binding inside timeout callback', () => {
    vi.useFakeTimers();
    const context = { count: 0 };

    const sampler = createSampler(function (this: typeof context, value: number) {
      this.count += value;
    }, 10, context);

    sampler(2);
    vi.advanceTimersByTime(10);

    expect(context.count).toBe(2);
  });
});
