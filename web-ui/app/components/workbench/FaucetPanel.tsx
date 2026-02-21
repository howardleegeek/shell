import React from 'react'
import { faucetHistory, faucetStatus, LAMPORTS_PER_SOL, requestAirdropSol, requestAnvilTransfer } from '../../lib/stores/faucet'

type Props = {
  chainType: 'solana' | 'evm'
  network: string
  pubkey: string
}

const FaucetPanel: React.FC<Props> = ({ chainType, network, pubkey }) => {
  const onSolanaDevnet = async () => {
    await requestAirdropSol(pubkey, 2 * LAMPORTS_PER_SOL)
  }

  const onAnvil = async () => {
    await requestAnvilTransfer(pubkey, 1 * 10 ** 18)
  }

  const history = (faucetHistory as any).get?.() ?? []

  return (
    <section aria-label="faucet-panel">
      {chainType === 'solana' && network === 'devnet' && (
        <button onClick={onSolanaDevnet}>Request Airdrop 2 SOL</button>
      )}

      {chainType === 'solana' && network === 'testnet' && (
        <a href="https://solana-testnet-faucet.example/" target="_blank" rel="noreferrer">
          Get SOL Testnet Faucet
        </a>
      )}

      {chainType === 'evm' && network === 'sepolia' && (
        <a href="https://faucet.sepolia.org" target="_blank" rel="noreferrer">
          Sepolia Faucet
        </a>
      )}

      {chainType === 'evm' && network === 'anvil' && (
        <button onClick={onAnvil}>Request 1 ETH from Anvil</button>
      )}

      <div>
        <h4>History</h4>
        <ul>
          {Array.isArray(history) && history.length > 0
            ? history.map((r: any, idx: number) => (
                <li key={idx}>
                  {r.chain}:{r.network} {r.amount}{' '}
                  {r.txHash ? `tx ${r.txHash}` : ''}
                </li>
              ))
            : <li>No history</li>}
        </ul>
      </div>
      <div>
        <strong>Current status:</strong> {faucetStatus.get?.() ?? 'unknown'}
      </div>
    </section>
  )
}

export default FaucetPanel
