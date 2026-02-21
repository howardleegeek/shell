import React from 'react'

// Contract size analyzer for EVM bytecode and SVM .so libraries.
// This component renders a per-contract size bar with color thresholds and
// a human-friendly display string. It is intentionally lightweight and
// designed to be consumed by the Build Report UI.

type EvmSpec = {
  deployedBytecode?: string
  // Optional testing override to avoid large test fixtures
  mockSizeBytes?: number
}

type SvmSpec = {
  soSizeBytes?: number
  mockSizeBytes?: number
}

type ContractSizeData = {
  name: string
  evm?: EvmSpec
  svm?: SvmSpec
}

type Props = {
  // Primary API: a list of contracts with embedded EVM/SVM data
  contracts?: ContractSizeData[]
  // Backwards-compatibility: allow providing separate EVM and SVM contract lists
  evmContracts?: Array<{ name: string; deployedBytecode?: string; mockSizeBytes?: number }>
  svmContracts?: Array<{ name: string; soSizeBytes?: number; mockSizeBytes?: number }>
  // Optional: override display limits (kept for future extension)
  evmLimitKB?: number
  svmLimitMB?: number
}

// Helpers
const DEFAULT_EVM_LIMIT_KB = 24
const DEFAULT_SVM_LIMIT_MB = 10

function toBytes(hexOrEmpty?: string): number {
  if (!hexOrEmpty) return 0
  const str = hexOrEmpty.startsWith('0x') ? hexOrEmpty.slice(2) : hexOrEmpty
  if (str.length === 0) return 0
  // Each pair of hex chars is one byte
  return Math.max(0, str.length / 2)
}

export function colorForSize(sizeBytes: number, kind: 'evm' | 'svm') {
  if (kind === 'evm') {
    // EVM thresholds: green < 20KB, yellow 20KB-24KB, red > 24KB
    if (sizeBytes < 20 * 1024) return 'green'
    if (sizeBytes <= 24 * 1024) return 'yellow'
    return 'red'
  }
  // svm: green < 5MB, yellow 5-10MB, red > 10MB
  if (sizeBytes < 5 * 1024 * 1024) return 'green'
  if (sizeBytes <= 10 * 1024 * 1024) return 'yellow'
  return 'red'
}

export function formatSizeBarLabel(sizeBytes: number, kind: 'evm' | 'svm') {
  if (kind === 'evm') {
    const limit = 24 * 1024
    const kb = sizeBytes / 1024
    const percent = Math.round((sizeBytes / limit) * 100)
    return `${kb.toFixed(1)}KB / 24KB (${percent}%)`
  }
  const limitMB = 10
  const mb = sizeBytes / (1024 * 1024)
  const percent = Math.round((sizeBytes / (limitMB * 1024 * 1024)) * 100)
  return `${mb.toFixed(1)}MB / 10MB (${percent}%)`
}

// For testing and deterministic rendering in a non-UI environment
export function computeContractSizes(contract: ContractSizeData): { kind: 'evm' | 'svm'; sizeBytes: number }[] {
  const results: { kind: 'evm' | 'svm'; sizeBytes: number }[] = []
  if (contract.evm) {
    const b = contract.evm.mockSizeBytes ?? (contract.evm.deployedBytecode ? toBytes(contract.evm.deployedBytecode) : 0)
    results.push({ kind: 'evm', sizeBytes: b })
  }
  if (contract.svm) {
    const b = contract.svm.mockSizeBytes ?? contract.svm.soSizeBytes ?? 0
    results.push({ kind: 'svm', sizeBytes: b })
  }
  return results
}

// Build a unified list of contracts from either the primary API or legacy split lists
function mergeContractsFromProps(p: Props): ContractSizeData[] {
  if (p.contracts && p.contracts.length > 0) {
    return p.contracts
  }
  const merged: ContractSizeData[] = []
  if (p.evmContracts) {
    for (const e of p.evmContracts) {
      merged.push({ name: e.name, evm: { deployedBytecode: e.deployedBytecode, mockSizeBytes: e.mockSizeBytes } })
    }
  }
  if (p.svmContracts) {
    for (const s of p.svmContracts) {
      merged.push({ name: s.name, svm: { soSizeBytes: s.soSizeBytes, mockSizeBytes: s.mockSizeBytes } })
    }
  }
  return merged
}

export default function ContractSizeBar({ contracts, evmContracts, svmContracts }: Props) {
  const effectiveContracts = mergeContractsFromProps({ contracts, evmContracts, svmContracts } as any)
  const renderContract = (c: ContractSizeData) => {
    const items = computeContractSizes(c)
    return (
      <div key={c.name} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
        {items.length === 0 && <div style={{ fontStyle: 'italic' }}>No data</div>}
        {items.map((it, idx) => {
          const label = formatSizeBarLabel(it.sizeBytes, it.kind)
          const color = colorForSize(it.sizeBytes, it.kind)
          const limit = it.kind === 'evm' ? 24 * 1024 : 10 * 1024 * 1024
          const percent = Math.min(100, Math.round((it.sizeBytes / limit) * 100))
          const colorClass = `bar ${color}`
          return (
            <div key={`${c.name}-${idx}`} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textTransform: 'uppercase', fontSize: 12, color: '#555' }}>{it.kind.toUpperCase()}</span>
              </div>
              <div
                data-testid={`${c.name}-${it.kind}-bar`}
                style={{ height: 8, width: '100%', background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}
              >
                <div
                  className={colorClass}
                  style={{ width: `${percent}%`, height: '100%', background: color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#f87171' }}
                />
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{label}</div>
              {it.sizeBytes > limit && (
                <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 2 }}>
                  该合约尺寸超出上限，请考虑拆分或使用库以降低字节码大小。
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return <div className="contract-size-bar" style={{ padding: 12 }}>{effectiveContracts.map(renderContract)}</div>
}
