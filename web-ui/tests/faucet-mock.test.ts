import { afterEach, describe, expect, test } from 'vitest'

import {
  faucetStatus,
  faucetHistory,
  LAMPORTS_PER_SOL,
  requestAirdropSol,
  requestAnvilTransfer,
  resetFaucet,
} from '../app/lib/stores/faucet'

describe('Faucet mock path tests', () => {
  afterEach(() => {
    resetFaucet()
  })

  test('Solana airdrop mock when no connection', async () => {
    resetFaucet()
    const pubkey = 'mock_pubkey_solana'
    const lamports = 2 * LAMPORTS_PER_SOL

    const txHash = await requestAirdropSol(pubkey, lamports)

    expect(typeof txHash).toBe('string')
    expect((faucetStatus.get?.() ?? '')).toBe('success')

    const history = (faucetHistory as any).get?.() ?? []
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)
    const first = history[0]
    expect(first.chain).toBe('solana')
    expect(first.network).toBe('devnet')
    expect(first.amount).toBe(lamports)
    expect(typeof first.txHash).toBe('string')
  })

  test('Anvil ETH mock when no provider', async () => {
    resetFaucet()
    const pubkey = 'mock_pubkey_eth'
    const wei = 1 * 10 ** 18

    const txHash = await requestAnvilTransfer(pubkey, wei)

    expect(typeof txHash).toBe('string')
    expect((faucetStatus.get?.() ?? '')).toBe('success')

    const history = (faucetHistory as any).get?.() ?? []
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)
    const first = history[0]
    expect(first.chain).toBe('evm')
    expect(first.network).toBe('anvil')
    expect(first.amount).toBe(wei)
    expect(typeof first.txHash).toBe('string')
  })
})
