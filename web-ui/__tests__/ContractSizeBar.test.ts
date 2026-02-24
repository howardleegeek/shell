import { describe, it, expect } from 'vitest'
import { colorForSize, formatSizeBarLabel, computeContractSizes } from '../app/components/workbench/ContractSizeBar.tsx'

describe('ContractSizeBar utilities', () => {
  it('evm color thresholds: green < 20KB, yellow 20-24KB, red > 24KB', () => {
    expect(colorForSize(10 * 1024, 'evm')).toBe('green') // 10KB
    expect(colorForSize(22 * 1024, 'evm')).toBe('yellow') // 22KB
    expect(colorForSize(25 * 1024, 'evm')).toBe('red') // 25KB
  })

  it('evm boundary at 24,576 bytes (24.576 KB)', () => {
    expect(colorForSize(24_576, 'evm')).toBe('yellow')
    expect(colorForSize(24_577, 'evm')).toBe('red')
  })

  it('evm size label formatting', () => {
    // 12800 bytes -> 12.5 KB; 24KB limit; expect 52% rounded
    expect(formatSizeBarLabel(12800, 'evm')).toBe('12.5KB / 24KB (52%)')
  })

  it('svm color thresholds: <5MB green, 5-10MB yellow, >10MB red', () => {
    expect(colorForSize(4 * 1024 * 1024, 'svm')).toBe('green') // 4MB
    expect(colorForSize(6 * 1024 * 1024, 'svm')).toBe('yellow') // 6MB
    expect(colorForSize(12 * 1024 * 1024, 'svm')).toBe('red') // 12MB
  })

  it('svm size label formatting', () => {
    // 6MB -> 60% of 10MB
    expect(formatSizeBarLabel(6 * 1024 * 1024, 'svm')).toBe('6.0MB / 10MB (60%)')
  })

  it('computes per-contract sizes for both evm and svm', () => {
    const contract = {
      name: 'Test',
      evm: { mockSizeBytes: 12800 },
      svm: { soSizeBytes: 6 * 1024 * 1024 },
    } as any

    const sizes = computeContractSizes(contract)
    // Expect two entries: first evm, then svm
    expect(sizes.length).toBe(2)
    expect(sizes[0]).toEqual({ kind: 'evm', sizeBytes: 12800 })
    expect(sizes[1]).toEqual({ kind: 'svm', sizeBytes: 6 * 1024 * 1024 })
  })
})
