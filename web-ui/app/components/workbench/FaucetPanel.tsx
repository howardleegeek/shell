import React from 'react'
import { faucetHistory, faucetStatus, LAMPORTS_PER_SOL, requestAirdropSol, requestAnvilTransfer } from '../../lib/stores/faucet'

import { useAtom } from 'nanostores'

import { Button } from '../../components/ui/Button'
import { ExternalLink } from '../../components/ui/ExternalLink'

import { toast } from '../../lib/toast'

import { formatBalance } from '../../lib/utils/formatBalance'

import { ChainSelector } from '../../components/ChainSelector'

import { getNetworkName } from '../../lib/utils/getNetworkName'

import { useSolanaConnection } from '../../hooks/useSolanaConnection'

import { useAnvilProvider } from '../../hooks/useAnvilProvider'

type Props = {
  chainType: 'solana' | 'evm'
  network: string
  pubkey: string
}

const FaucetPanel: React.FC<Props> = ({ chainType, network, pubkey }) => {
  const [status, setStatus] = useAtom(faucetStatus)
  const [history, setHistory] = useAtom(faucetHistory)

  const { connection } = useSolanaConnection()
  const { provider, privateKey } = useAnvilProvider()

  const requestSolanaAirdrop = async () => {
    if (!connection) {
      toast.error('Solana connection not available')
      return
    }
    
    try {
      setStatus('requesting')
      const txHash = await requestAirdropSol(pubkey, 2 * LAMPORTS_PER_SOL)
      toast.success('SOL airdrop requested successfully!')
      console.log('SOL airdrop tx:', txHash)
    } catch (error) {
      toast.error('Failed to request SOL airdrop: ' + (error as Error).message)
      setStatus('error')
    }
  }

  const requestAnvilEth = async () => {
    if (!provider || !privateKey) {
      toast.error('Anvil provider not available')
      return
    }
    
    try {
      setStatus('requesting')
      const txHash = await requestAnvilTransfer(pubkey, 1 * 10 ** 18)
      toast.success('ETH transferred successfully!')
      console.log('ETH transfer tx:', txHash)
    } catch (error) {
      toast.error('Failed to transfer ETH: ' + (error as Error).message)
      setStatus('error')
    }
  }

  const historyItems = Array.isArray(history) ? history : []

  return (
    <section aria-label="faucet-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Testnet Faucet</h3>
        <p className="text-sm text-muted-foreground">
          Request test tokens for your selected network
        </p>
      </div>

      {chainType === 'solana' && network === 'devnet' && (
        <Button 
          onClick={requestSolanaAirdrop}
          disabled={status === 'requesting'}
          className="w-full mb-2"
        >
          {status === 'requesting' ? 'Requesting... 🔄' : 'Request 2 SOL'}
        </Button>
      )}

      {chainType === 'solana' && network === 'testnet' && (
        <ExternalLink
          href="https://solana-testnet-api.devnet.verifiedwallet.com/api/v1/faucet"
          target="_blank"
          rel="noreferrer"
          className="w-full mb-2 btn btn-outline"
        >
          Get SOL Testnet Faucet
        </ExternalLink>
      )}

      {chainType === 'evm' && network === 'sepolia' && (
        <ExternalLink
          href="https://faucet.sepolia.org"
          target="_blank"
          rel="noreferrer"
          className="w-full mb-2 btn btn-outline"
        >
          Sepolia Faucet
        </ExternalLink>
      )}

      {chainType === 'evm' && network === 'base-sepolia' && (
        <ExternalLink
          href="https://base-goerli-faucet.chainstack.com"
          target="_blank"
          rel="noreferrer"
          className="w-full mb-2 btn btn-outline"
        >
          Base Sepolia Faucet
        </ExternalLink>
      )}

      {chainType === 'evm' && network === 'anvil' && (
        <Button 
          onClick={requestAnvilEth}
          disabled={status === 'requesting'}
          className="w-full mb-2"
        >
          {status === 'requesting' ? 'Transferring... 🔄' : 'Request 1 ETH from Anvil'}
        </Button>
      )}

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">History</h4>
        <div className="space-y-1">
          {historyItems.length > 0
            ? historyItems.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {r.chain.toUpperCase()}:{r.network}
                  </span>
                  <span className="font-mono">
                    {formatBalance(r.amount, r.chain)}
                  </span>
                  <span className="text-green-600">
                    {r.txHash ? '✓' : '—'}
                  </span>
                </div>
              ))
            : (
              <div className="text-xs text-muted-foreground">
                No requests yet
              </div>
            )}
        </div>
      </div>

      <div className="mt-4 pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          <strong>Status:</strong> {status}
        </div>
      </div>
    </section>
  )
}

export default FaucetPanel
