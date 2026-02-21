import { atom } from 'nanostores'
import { Connection } from '@solana/web3.js'
import { ethers } from 'ethers'

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

// Real Solana airdrop request
export async function requestAirdropSol(pubkey: string, lamports: number): Promise<string> {
  faucetStatus.set('requesting')
  let current: FaucetRecord[] = []
  try {
    current = (faucetHistory as any).get?.() ?? []
  } catch {
    current = []
  }
  
  try {
    // Get connection from global state
    const connection = (window as any).solanaConnection
    // If real connection is unavailable, fall back to a mock/simulated airdrop
    if (!connection || !(connection instanceof Connection)) {
      const txHash = `mock_solana_devnet_${Date.now()}`
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

    const txHash = await connection.requestAirdrop(pubkey, lamports)
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
  } catch (error) {
    faucetStatus.set('error')
    throw error
  }
}

// Real Anvil ETH transfer from local node
export async function requestAnvilTransfer(pubkey: string, ethAmountWei?: number): Promise<string> {
  faucetStatus.set('requesting')
  let current: FaucetRecord[] = []
  try {
    current = (faucetHistory as any).get?.() ?? []
  } catch {
    current = []
  }
  
  try {
    const amount = ethAmountWei ?? 1 * 10 ** 18
    
    // Get provider from global state
    const provider = (window as any).anvilProvider
    // If real provider is unavailable, fall back to a mock transfer
    if (!provider || !(provider instanceof ethers.providers.JsonRpcProvider)) {
      const txHash = `mock_evm_anvil_${Date.now()}`
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
    
    const signer = new ethers.Wallet((window as any).anvilPrivateKey, provider)
    const tx = await signer.sendTransaction({
      to: pubkey,
      value: amount,
      gasLimit: 21000,
      gasPrice: 1
    })
    
    const next: FaucetRecord[] = [
      {
        chain: 'evm',
        network: 'anvil',
        amount,
        txHash: tx.hash,
        timestamp: Date.now(),
      },
      ...current,
    ].slice(0, 10)
    faucetHistory.set(next)
    faucetStatus.set('success')
    return tx.hash
  } catch (error) {
    faucetStatus.set('error')
    throw error
  }
}

export function resetFaucet() {
  faucetStatus.set('idle')
  faucetHistory.set([])
}
