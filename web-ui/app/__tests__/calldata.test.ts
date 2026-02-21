import { describe, it, expect } from 'vitest';
import { encodeCalldata, decodeCalldata } from '../lib/calldata';

describe('Calldata codec (encode/decode)', () => {
  const abi = [
    { name: 'setValue', inputs: [{ name: 'newValue', type: 'uint256' }] },
    { name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  ] as any;

  it('encodes and decodes a simple function round-trip', () => {
    const encoded = encodeCalldata('setValue', [123], abi);
    expect(encoded).toBeTruthy();
    expect(encoded.startsWith('0x')).toBe(true);
    const decoded = decodeCalldata(encoded, abi);
    expect(decoded.functionName).toBe('setValue');
    // decoded.args is a tuple-like; ensure it contains the given value
    expect(decoded.args && decoded.args[0].toString()).toBe('123');
  });
});
