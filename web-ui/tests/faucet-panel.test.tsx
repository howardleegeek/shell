import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import FaucetPanel from '../app/components/workbench/FaucetPanel'

describe('FaucetPanel', () => {
  it('renders Solana devnet airdrop button and can trigger airdrop', async () => {
    // Render Solana devnet faucet panel
    render(
      <FaucetPanel chainType="solana" network="devnet" pubkey="testpub" />
    )
    const btn = screen.getByText('Request Airdrop 2 SOL')
    expect(btn).toBeInTheDocument()
    // Click to trigger airdrop (function is implemented in module; ensure no crash)
    fireEvent.click(btn)
  })

  it('renders Sepolia external faucet link', () => {
    render(<FaucetPanel chainType="evm" network="sepolia" pubkey="0xabc" />)
    const link = screen.getByText('Sepolia Faucet')
    expect(link).toBeInTheDocument()
    expect((link as HTMLAnchorElement).href).toBe('https://faucet.sepolia.org')
  })
})
