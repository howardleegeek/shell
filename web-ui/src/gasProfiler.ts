export interface GasFuncStat {
  name: string
  min: number
  avg: number
  max: number
  calls: number
  delta?: number
}

export interface ComputeStat {
  name: string
  compute: number
  delta?: number
}

/**
 * Parse a simple gas report into structured stats.
 * Expected blocks like:
 * Function: transfer(address,uint256)
 * min: 123
 * avg: 130
 * max: 140
 * calls: 10
 *
 * Supports optional previous array to compute delta percentages.
 */
export function parseGasReport(report: string, previous?: GasFuncStat[]): GasFuncStat[] {
  const lines = report
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const results: GasFuncStat[] = []
  let current: Partial<GasFuncStat> = {}
  const prevMap: Record<string, GasFuncStat> = {}
  if (previous) {
    for (const p of previous) prevMap[p.name] = p
  }

  for (const line of lines) {
    const funcMatch = line.match(/^Function:\s*(.+)$/i)
    if (funcMatch) {
      // push previous block if complete
      if (
        current.name &&
        typeof current.min === 'number' &&
        typeof current.avg === 'number' &&
        typeof current.max === 'number' &&
        typeof current.calls === 'number'
      ) {
        results.push(current as GasFuncStat)
      }
      current = { name: funcMatch[1], min: 0, avg: 0, max: 0, calls: 0 }
      continue
    }
    const mMin = line.match(/^min:\s*(\d+(?:\.\d+)?)$/i)
    if (mMin && current) current.min = Number(mMin[1])
    const mAvg = line.match(/^avg:\s*(\d+(?:\.\d+)?)$/i)
    if (mAvg && current) current.avg = Number(mAvg[1])
    const mMax = line.match(/^max:\s*(\d+(?:\.\d+)?)$/i)
    if (mMax && current) current.max = Number(mMax[1])
    const mCalls = line.match(/^calls:\s*(\d+(?:\.\d+)?)$/i)
    if (mCalls && current) current.calls = Number(mCalls[1])
  }

  // Push last block if complete
  if (
    current.name &&
    typeof current.min === 'number' &&
    typeof current.avg === 'number' &&
    typeof current.max === 'number' &&
    typeof current.calls === 'number'
  ) {
    results.push(current as GasFuncStat)
  }

  // Compute delta vs previous if provided
  if (previous && previous.length) {
    const prevByName: Record<string, number> = {}
    for (const p of previous) prevByName[p.name] = p.avg
    for (const r of results) {
      const prevAvg = prevByName[r.name]
      if (typeof prevAvg === 'number' && prevAvg !== 0) {
        r.delta = Math.round(((r.avg - prevAvg) / prevAvg) * 100)
      }
    }
  }

  return results
}

/**
 * Parse a simple compute-report into structured stats.
 * Expected blocks like:
 * Instruction: load
 * compute: 123
 *
 * Supports optional previous array to compute delta percentages.
 */
export function parseComputeReport(report: string, previous?: ComputeStat[]): ComputeStat[] {
  const lines = report
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const results: ComputeStat[] = []
  let current: Partial<ComputeStat> = {}
  const prevMap: Record<string, ComputeStat> = {}
  if (previous) {
    for (const p of previous) prevMap[p.name] = p
  }

  for (const line of lines) {
    const instMatch = line.match(/^Instruction:\s*(.+)$/i)
    if (instMatch) {
      if (current.name && typeof current.compute === 'number') {
        results.push(current as ComputeStat)
      }
      current = { name: instMatch[1], compute: 0 }
      continue
    }
    const mCompute = line.match(/^compute:\s*(\d+(?:\.?\d+)?)$/i)
    if (mCompute && current) current.compute = Number(mCompute[1])
  }

  // Push last block if complete
  if (current.name && typeof current.compute === 'number') {
    results.push(current as ComputeStat)
  }

  // Compute delta vs previous if provided
  if (previous && previous.length) {
    const prevByName: Record<string, number> = {}
    for (const p of previous) prevByName[p.name] = p.compute
    for (const r of results) {
      const prevCompute = prevByName[r.name]
      if (typeof prevCompute === 'number' && prevCompute !== 0) {
        r.delta = Math.round(((r.compute - prevCompute) / prevCompute) * 100)
      }
    }
  }

  return results
}

// Simple heat color for UI (green-low, red-high) based on avg/max ratio
export function gasHeatColor(avg: number, max: number): string {
  if (max <= 0) return '#4caf50'
  const t = Math.min(1, Math.max(0, avg / max))
  const r = Math.round(255 * t)
  const g = Math.round(255 * (1 - t))
  return `rgb(${r},${g},0)`
}
