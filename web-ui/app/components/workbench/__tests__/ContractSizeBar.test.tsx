import React from 'react'
import { render, screen } from '@testing-library/react'
import ContractSizeBar, { formatSizeBarLabel, colorForSize, computeContractSizes } from '../ContractSizeBar'

describe('ContractSizeBar utilities', () => {
  test('evm format label', () => {
    // 10KB => 10.0KB, limit 24KB -> 42%
    const label = formatSizeBarLabel(10 * 1024, 'evm')
    expect(label).toBe('10.0KB / 24KB (42%)')
  })

  test('svm format label', () => {
    // 5MB => 5.0MB, limit 10MB -> 50%
    const label = formatSizeBarLabel(5 * 1024 * 1024, 'svm')
    expect(label).toBe('5.0MB / 10MB (50%)')
  })
})

describe('Contract size color logic', () => {
  test('evm color thresholds', () => {
    expect(colorForSize(10 * 1024, 'evm')).toBe('green')
    expect(colorForSize(22 * 1024, 'evm')).toBe('yellow')
    expect(colorForSize(30 * 1024, 'evm')).toBe('red')
  })

  test('svm color thresholds', () => {
    expect(colorForSize(1 * 1024 * 1024, 'svm')).toBe('green')
    expect(colorForSize(6 * 1024 * 1024, 'svm')).toBe('yellow')
    expect(colorForSize(12 * 1024 * 1024, 'svm')).toBe('red')
  })
})

describe('ContractSizeBar rendering', () => {
  test('renders multiple contract entries with bars', () => {
    const contracts = [
      {
        name: 'EVMBasic',
        evm: { mockSizeBytes: 10 * 1024 },
      },
      {
        name: 'SVMLib',
        svm: { mockSizeBytes: 6 * 1024 * 1024 },
      },
    ]
    render(<ContractSizeBar contracts={contracts} />)
    // EVMBasic bar label should render
    expect(screen.getByText('EVMBasic')).toBeTruthy()
    // bars presence
    expect(screen.getByTestId('EVMBasic-evm-bar')).toBeTruthy()
    // SVMLib bar presence
    expect(screen.getByTestId('SVMLib-svm-bar')).toBeTruthy()
  })

  test('evm DeployBytecode size from deployedBytecode string', () => {
    const contracts = [
      {
        name: 'EVMBasic',
        evm: { deployedBytecode: '0x60016000' }, // 4 bytes
      },
    ]
    render(<ContractSizeBar contracts={contracts} />)
    // Expect a label showing 4 bytes => 0.0KB / 24KB (0%)
    expect(screen.getByText('0.0KB / 24KB (0%)')).toBeTruthy()
  })

  test('shows warning when contract size exceeds limit', () => {
    const contracts = [
      {
        name: 'BigEVMBad',
        evm: { mockSizeBytes: 30 * 1024 }, // 30KB > 24KB limit
      },
    ]
    render(<ContractSizeBar contracts={contracts} />)
    expect(
      screen.getByText(
        '该合约尺寸超出上限，请考虑拆分或使用库以降低字节码大小。'
      )
    ).toBeTruthy()
  })
})
