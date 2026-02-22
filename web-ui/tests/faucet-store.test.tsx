import { describe, it, expect, beforeEach } from 'vitest'
import { faucetStatus, faucetHistory, LAMPORTS_PER_SOL, requestAirdropSol, requestAnvilTransfer, resetFaucet } from '../app/lib/stores/faucet'

describe('Faucet store', () => {
  beforeEach(() => {
    resetFaucet()
  })

  it('initializes with idle status and empty history', () => {
    // @ts-ignore
    expect((faucetStatus as any).get()).toBe('idle')
    // @ts-ignore
    expect((faucetHistory as any).get()).toEqual([])
  })

  it('records Solana airdrop and updates status', async () => {
    const tx = await requestAirdropSol('pubkey', 2 * LAMPORTS_PER_SOL)
    expect(typeof tx).toBe('string')
    // status should be success
    // @ts-ignore
    expect((faucetStatus as any).get()).toBe('success')
    // history should contain at least one entry
    // @ts-ignore
    const hist = faucetHistory.get?.() ?? []
    expect(hist.length).toBeGreaterThanOrEqual(1)
    const last = hist[0]
    expect(last.chain).toBe('solana')
    expect(last.network).toBe('devnet')
    expect(last.amount).toBe(2 * LAMPORTS_PER_SOL)
  })

  it('Anvil transfer updates history', async () => {
    const tx = await requestAnvilTransfer('pubkey', 1 * 10 ** 18)
    expect(typeof tx).toBe('string')
    // history should include anvil record
    const hist = (faucetHistory as any).get?.() ?? []
    expect(hist.find((h: any) => h.chain === 'evm' && h.network === 'anvil')).toBeTruthy()
  })
})

// tiny helper to assert idle status placeholder (avoid touching internal state directly in tests)
function faucetStatusOrIdle() {
  // This test suite uses the module's side effects; simply return true to satisfy type checks here
  return true
}
