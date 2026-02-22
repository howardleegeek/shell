import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Web3TemplatesPanel } from '../components/Web3TemplatesPanel'

describe('Web3TemplatesPanel', () => {
  test('renders SVM and EVM tabs with templates and selects prompt', () => {
    const onSelect = jest.fn()
    render(<Web3TemplatesPanel onSelect={onSelect} />)

    // SVM templates should render by default
    expect(screen.getByText('SPL Token')).toBeInTheDocument()
    expect(screen.getByText('NFT Collection')).toBeInTheDocument()

    // click a template
    const tokenCard = screen.getByText('SPL Token')
    fireEvent.click(tokenCard)
    // ensure prompt passed
    expect(onSelect).toHaveBeenCalledWith(
      'Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor\'s #[account] macros for account validation.'
    )

    // switch to EVM tab
    const evmTab = screen.getByText('EVM')
    fireEvent.click(evmTab)
    // EVM templates should render
    expect(screen.getByText('ERC-20 Token')).toBeInTheDocument()
  })
})
