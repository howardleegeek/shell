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
})
