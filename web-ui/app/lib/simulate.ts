// Lightweight local simulator utilities for TxSimulator
// This module provides a deterministic, dependency-free mock that
// mimics a subset of a real EVM/SVM trace for unit tests and UI demos.

export type StateDiffRow = {
  slot: string
  before: string
  after: string
}

export type SimulationInput = {
  to: string
  value?: string
  calldata?: string
}

export type SimulationResult = {
  gasUsed: number
  stateDiff: StateDiffRow[]
  events: string[]
  returnValue: string
  revertReason?: string
  // Optional fields for future SVM support
  svmComputeUnits?: number
  svmLogs?: string[]
}

// Convert ASCII string to a hex string with 0x prefix
function toHex(text: string): string {
  return (
    '0x' +
    Array.from(text)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function simulateLocal(input: SimulationInput): SimulationResult {
  const to = input.to || ''
  const calldataLen = input.calldata?.length || 0
  // Simple deterministic gas model influenced by calldata length and presence of "to"
  const gasUsed = 21000 + Math.min(120000, calldataLen * 20) + (to ? 500 : 0)

  const stateDiff: StateDiffRow[] = [
    {
      slot: '0x0',
      before: '0x00',
      after: '0x01',
    },
  ]

  const events = ['Log: TxSimulator simulated']
  const returnValue = toHex('simulated_return')

  return {
    gasUsed,
    stateDiff,
    events,
    returnValue,
    // No revert by default in this mock
  }
}
