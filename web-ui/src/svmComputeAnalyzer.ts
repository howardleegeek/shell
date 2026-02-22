export interface ComputeUnitStat {
  instruction: string
  count: number
  totalCompute: number
  avgCompute: number
}

export interface SolanaTxStat {
  sizeBytes: number
  computeUnits: number
  estimatedFee: number
}

/**
 * Parse compute units from anchor test logs
 * Example log format:
 * Instruction: Initialize
 * Compute units: 1500
 * Instruction: Transfer
 * Compute units: 800
 */
export function parseComputeUnits(log: string): ComputeUnitStat[] {
  const lines = log.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  const results: ComputeUnitStat[] = []
  let current: Partial<ComputeUnitStat> = {}

  for (const line of lines) {
    const instMatch = line.match(/^Instruction:\s*(.+)$/i)
    if (instMatch) {
      // push previous block if complete
      if (current.instruction && typeof current.totalCompute === 'number' && typeof current.count === 'number') {
        current.avgCompute = current.totalCompute / current.count
        results.push(current as ComputeUnitStat)
      }
      current = { instruction: instMatch[1], count: 1, totalCompute: 0 }
      continue
    }
    const computeMatch = line.match(/^Compute units:\s*(\d+)$/i)
    if (computeMatch && current) {
      const compute = Number(computeMatch[1])
      current.totalCompute = (current.totalCompute || 0) + compute
      current.count = (current.count || 0) + 1
    }
  }

  // Push last block if complete
  if (current.instruction && typeof current.totalCompute === 'number' && typeof current.count === 'number') {
    current.avgCompute = current.totalCompute / current.count
    results.push(current as ComputeUnitStat)
  }

  return results
}

/**
 * Analyze Solana transaction size and compute
 * @param contractSize Size of compiled contract in bytes
 * @param instructionCount Number of instructions in transaction
 * @returns Analysis of transaction characteristics
 */
export function analyzeSolanaTx(contractSize: number, instructionCount: number): SolanaTxStat {
  const baseOverhead = 200 // base tx overhead in bytes
  const instructionOverhead = 50 // per instruction overhead
  const accountDataOverhead = 100 // for account data
  
  const sizeBytes = baseOverhead + instructionOverhead * instructionCount + accountDataOverhead + contractSize
  const computeUnits = 1000 + 500 * instructionCount // rough estimate
  const lamportsPerCompute = 0.0009
  const lamportsPerByte = 0.00005
  
  const estimatedFee = computeUnits * lamportsPerCompute + sizeBytes * lamportsPerByte
  
  return {
    sizeBytes,
    computeUnits,
    estimatedFee
  }
}

/**
 * Color coding for compute units (green-low, red-high)
 */
export function computeHeatColor(computeUnits: number): string {
  if (computeUnits <= 1000) return '#4caf50' // green
  if (computeUnits <= 5000) return '#ff9800' // orange
  return '#f44336' // red
}