// Minimal Local Explorer helper for in-IDE block explorer
export type TxEntry = {
  hash: string
  from: string
  to: string
  value: string
  status: string
  timestamp?: string
}

export type ExplorerData = {
  evmTxs: TxEntry[]
  svmTxs: TxEntry[]
  accounts: { address: string; balance: string }[]
}

// Deterministic sample data for local explorer demos
export function buildLocalExplorerData(seed?: number): ExplorerData {
  // Simple deterministic seeds
  const s = typeof seed === 'number' ? seed : 42
  const evmTxs: TxEntry[] = [
    {
      hash: '0xEVMTx1-' + s,
      from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      value: '1.0 ETH',
      status: 'Success',
      timestamp: new Date().toISOString(),
    },
    {
      hash: '0xEVMTx2-' + (s + 1),
      from: '0xcccccccccccccccccccccccccccccccccccccccc',
      to: '0xdddddddddddddddddddddddddddddddddddddddd',
      value: '0.5 ETH',
      status: 'Success',
      timestamp: new Date().toISOString(),
    },
  ]
  const svmTxs: TxEntry[] = [
    {
      hash: '0xSvmTx1-' + s,
      from: 'SVM-Account1',
      to: 'SVM-Program1',
      value: '0.0 SOL',
      status: 'Success',
      timestamp: new Date().toISOString(),
    },
    {
      hash: '0xSvmTx2-' + (s + 2),
      from: 'SVM-Account2',
      to: 'SVM-Program2',
      value: '0.1 SOL',
      status: 'Success',
      timestamp: new Date().toISOString(),
    },
  ]
  const accounts = [
    { address: evmTxs[0].from, balance: '10.0 ETH' },
    { address: evmTxs[1].from, balance: '2.5 ETH' },
  ]
  return { evmTxs, svmTxs, accounts }
}

// Lightweight, non-React data export intended for tests and simple UI wiring.
export const LocalExplorerPanel = (): any => null
