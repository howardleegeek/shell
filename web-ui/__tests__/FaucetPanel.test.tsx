import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import FaucetPanel from '~/app/components/workbench/FaucetPanel'

describe('FaucetPanel', () => {
  test('evm/sepolia shows Sepolia faucet link', () => {
    render(<FaucetPanel chainType="evm" network="sepolia" pubkey="0xDEADBEEF" />)
    const link = screen.getByText(/Sepolia Faucet/i)
    expect(link).toBeTruthy()
    expect((link as HTMLAnchorElement).href).toContain('faucet.sepolia.org')
  })
})
