import { atom } from 'nanostores'

export type FaucetStatus = 'idle' | 'requesting' | 'success' | 'error'

export const faucetStatus = atom<FaucetStatus>('idle')

export type FaucetRecord = {
  chain: string
  network: string
  amount: number
  txHash?: string
  timestamp: number
}

export const faucetHistory = atom<FaucetRecord[]>([])

export const LAMPORTS_PER_SOL = 1_000_000_000

// Simulated Solana airdrop request (no real network call in tests)
export async function requestAirdropSol(pubkey: string, lamports: number): Promise<string> {
  faucetStatus.set('requesting')
  const txHash = 'tx_' + Date.now().toString(36)
  let current: FaucetRecord[] = []
  try {
    current = (faucetHistory as any).get?.() ?? []
  } catch {
    current = []
  }
  const next: FaucetRecord[] = [
    {
      chain: 'solana',
      network: 'devnet',
      amount: lamports,
      txHash,
      timestamp: Date.now(),
    },
    ...current,
  ].slice(0, 10)
  faucetHistory.set(next)
  faucetStatus.set('success')
  return txHash
}

// Simulated Anvil ETH transfer from local node
export async function requestAnvilTransfer(pubkey: string, lamportsWei?: number): Promise<string> {
  faucetStatus.set('requesting')
  const amount = lamportsWei ?? 1 * 10 ** 18
  const txHash = 'anvil_' + Date.now().toString(36)
  let current: FaucetRecord[] = []
  try {
    current = (faucetHistory as any).get?.() ?? []
  } catch {
    current = []
  }
  const next: FaucetRecord[] = [
    {
      chain: 'evm',
      network: 'anvil',
      amount,
      txHash,
      timestamp: Date.now(),
    },
    ...current,
  ].slice(0, 10)
  faucetHistory.set(next)
  faucetStatus.set('success')
  return txHash
}

export function resetFaucet() {
  faucetStatus.set('idle')
  faucetHistory.set([])
}
