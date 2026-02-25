import { describe, expect, it } from 'vitest'

import {
  EVM_YELLOW_MAX,
  classifyEvmContractSize,
  formatKilobytes,
  hexByteLength,
} from '../app/components/workbench/contractSize.js'

describe('contractSize utilities', () => {
  it('computes odd-length hex byte size with ceil', () => {
    expect(hexByteLength('0xabc')).toBe(2)
    expect(hexByteLength('abcde')).toBe(3)
  })

  it('throws TypeError for non-string input', () => {
    expect(() => hexByteLength(123 as unknown as string)).toThrow(TypeError)
  })

  it('uses EIP-170 threshold for EVM yellow max', () => {
    expect(EVM_YELLOW_MAX).toBe(24_576)
    expect(classifyEvmContractSize(24_576)).toBe('yellow')
    expect(classifyEvmContractSize(24_577)).toBe('red')
  })

  it('formats KB directly via toFixed(1)', () => {
    expect(formatKilobytes(1024)).toBe('1.0')
    expect(formatKilobytes(12_800)).toBe('12.5')
  })
})
