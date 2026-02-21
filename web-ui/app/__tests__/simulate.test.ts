import { describe, it, expect } from 'vitest';
import { simulateLocal } from '../lib/simulator';

describe('simulateLocal', () => {
  it('should return a normal simulation result', () => {
    const res = simulateLocal({ to: '0x1234', value: 1000, calldata: '0x01' });
    expect(typeof res.gasUsed).toBe('number');
    expect(Array.isArray(res.stateDiff)).toBe(true);
    expect(Array.isArray(res.events)).toBe(true);
    expect(res.revertReason).toBeUndefined();
  });

  it('should include revertReason when calldata triggers revert', () => {
    const res = simulateLocal({ to: '0x1234', value: 0, calldata: '0xdeadbeef' });
    expect(res.revertReason).toBeDefined();
  });
});
