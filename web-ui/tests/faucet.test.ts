import { afterEach, describe, expect, test } from 'vitest'

import {
  faucetStatus,
  faucetHistory,
  LAMPORTS_PER_SOL,
  requestAirdropSol,
  requestAnvilTransfer,
  resetFaucet,
} from '../app/lib/stores/faucet'

describe('Faucet store integration tests', () => {
  afterEach(() => {
    // Ensure a clean state between tests
    resetFaucet()
  })

  test('Solana airdrop updates history and status', async () => {
    // Reset to idle before test
    resetFaucet()
    const pubkey = 'test_pubkey_solana'
    const lamports = 2 * LAMPORTS_PER_SOL

    const txHash = await requestAirdropSol(pubkey, lamports)

    // Status should reflect success
    expect((faucetStatus.get?.() ?? '')).toBe('success')
    expect(typeof txHash).toBe('string')

    // History should contain at least one entry with correct fields
    const history = (faucetHistory as any).get?.() ?? []
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)
    const first = history[0]
    expect(first.chain).toBe('solana')
    expect(first.network).toBe('devnet')
    expect(first.amount).toBe(lamports)
    expect(typeof first.txHash).toBe('string')
  })

  test('Anvil ETH transfer updates history and status', async () => {
    resetFaucet()
    const pubkey = 'test_pubkey_eth'
    const wei = 1 * 10 ** 18

    const txHash = await requestAnvilTransfer(pubkey, wei)

    expect((faucetStatus.get?.() ?? '')).toBe('success')
    expect(typeof txHash).toBe('string')

    const history = (faucetHistory as any).get?.() ?? []
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)
    const first = history[0]
    expect(first.chain).toBe('evm')
    expect(first.network).toBe('anvil')
    expect(first.amount).toBe(wei)
  })
})
