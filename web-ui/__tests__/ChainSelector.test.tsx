import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'

import { ChainSelector } from '~/components/header/ChainSelector'
import { chainType, setChain } from '~/lib/stores/chain'

describe('ChainSelector', () => {
  test('toggles chain between SVM and EVM', () => {
    // Reset to a known state
    chainType.set('svm')
    render(<ChainSelector />)

    // Both options should be rendered
    expect(screen.getByText('SVM')).toBeTruthy()
    expect(screen.getByText('EVM')).toBeTruthy()

    // Click on EVM and verify store updated
    fireEvent.click(screen.getByText('EVM'))
    // The button would set to evm if not already
    expect(chainType.get()).toBe('evm')
  })
})
