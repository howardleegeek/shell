import React, { createContext, useContext, useState } from 'react'

type Chain = 'solana' | 'evm'

interface WalletState {
  walletAddress: string | null
  balance: number
  connected: boolean
  chain: Chain
}

interface WalletContextValue {
  state: WalletState
  connectSolana: () => void
  connectEVM: () => void
  disconnect: () => void
  setChain: (c: Chain) => void
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WalletState>({
    walletAddress: null,
    balance: 0,
    connected: false,
    chain: 'evm',
  })

  const connectSolana = () => {
    // Minimal simulated connection for Solana
    setState({ walletAddress: 'SoLanaPhantomAddr1ABCDEFG', balance: 2.35, connected: true, chain: 'solana' })
  }

  const connectEVM = () => {
    // Minimal simulated connection for EVM
    setState({ walletAddress: '0xAbCdEf1234567890', balance: 1.23, connected: true, chain: 'evm' })
  }

  const disconnect = () => {
    setState((s) => ({ ...s, walletAddress: null, balance: 0, connected: false }))
  }

  const setChain = (c: Chain) => {
    setState((s) => ({ ...s, chain: c }))
  }

  return (
    <WalletContext.Provider value={{ state, connectSolana, connectEVM, disconnect, setChain }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = (): WalletContextValue => {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return ctx
}

export type { Chain, WalletState }
