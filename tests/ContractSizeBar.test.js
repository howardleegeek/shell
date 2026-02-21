// Unit tests for contract size helpers (EVM/SVM) and formatting.
const { computeEvmSizeFromHex, computeSvmSizeFromBytes } = require('../web-ui/app/utils/contractSize');

describe('Contract size helpers', () => {
  test('EVM size from hex yields correct bytes and green color for 12.5KB', () => {
    // 12.5 KB = 12.5 * 1024 = 12800 bytes -> hex length = 25600 chars (without 0x)
    const hex = 'aa'.repeat(12800);
    const res = computeEvmSizeFromHex(hex);
    expect(res.bytes).toBe(12800);
    expect(res.kb).toBeCloseTo(12.5, 1);
    expect(res.color).toBe('green');
  });

  test('EVM size from hex yields red color for ~25KB', () => {
    // 25 KB = 25600 bytes
    const hex = 'aa'.repeat(25600);
    const res = computeEvmSizeFromHex(hex);
    expect(res.bytes).toBe(25600);
    expect(res.kb).toBeCloseTo(25.0, 1);
    expect(res.color).toBe('red');
  });

  test('SVM size from bytes yields green color for 4.5MB', () => {
    const bytes = 4.5 * 1024 * 1024; // 4.5 MB
    const res = computeSvmSizeFromBytes(bytes);
    expect(res.bytes).toBe(bytes);
    expect(res.mb).toBeCloseTo(4.50, 2);
    expect(res.color).toBe('green');
  });
});
