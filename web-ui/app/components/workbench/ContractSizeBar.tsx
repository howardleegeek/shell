export type ContractSizeKind = 'evm' | 'svm'

export type ContractSizeEntry = {
  kind: ContractSizeKind
  sizeBytes: number
}

export type ContractLike = {
  evm?: {
    mockSizeBytes?: number
  }
  svm?: {
    soSizeBytes?: number
  }
}

const EVM_WARNING_BYTES = 20 * 1024
const EVM_LIMIT_BYTES = 24_576
const SVM_WARNING_BYTES = 5 * 1024 * 1024
const SVM_LIMIT_BYTES = 10 * 1024 * 1024

function getLimitBytes(kind: ContractSizeKind): number {
  return kind === 'evm' ? EVM_LIMIT_BYTES : SVM_LIMIT_BYTES
}

export function colorForSize(sizeBytes: number, kind: ContractSizeKind): 'green' | 'yellow' | 'red' {
  if (kind === 'evm') {
    if (sizeBytes > EVM_LIMIT_BYTES) return 'red'
    if (sizeBytes >= EVM_WARNING_BYTES) return 'yellow'
    return 'green'
  }

  if (sizeBytes > SVM_LIMIT_BYTES) return 'red'
  if (sizeBytes >= SVM_WARNING_BYTES) return 'yellow'
  return 'green'
}

export function formatSizeBarLabel(sizeBytes: number, kind: ContractSizeKind): string {
  const limit = getLimitBytes(kind)
  const percent = Math.round((sizeBytes / limit) * 100)

  if (kind === 'evm') {
    return `${(sizeBytes / 1024).toFixed(1)}KB / 24KB (${percent}%)`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB / 10MB (${percent}%)`
}

export function computeContractSizes(contract: ContractLike): ContractSizeEntry[] {
  const sizes: ContractSizeEntry[] = []

  if (typeof contract.evm?.mockSizeBytes === 'number') {
    sizes.push({ kind: 'evm', sizeBytes: contract.evm.mockSizeBytes })
  }

  if (typeof contract.svm?.soSizeBytes === 'number') {
    sizes.push({ kind: 'svm', sizeBytes: contract.svm.soSizeBytes })
  }

  return sizes
}

export default function ContractSizeBar() {
  return null
}
