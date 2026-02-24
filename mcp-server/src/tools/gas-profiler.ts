// Gas Profiler MCP Tool
// - Profiles gas usage of smart contract functions using forge's gas report
// - Returns per-function gas data and simple heuristic optimization hints
// - No LLMs are invoked; hints are rule-based only

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

type Input = {
  project_dir: string
  contract_name?: string
}

type FunctionGas = {
  name: string
  calls: number
  avg_gas: number
  median_gas: number
  min_gas: number
  max_gas: number
}

type ContractGas = {
  name: string
  functions: FunctionGas[]
}

type OptimizationHint = {
  function_name: string
  current_gas: number
  hint: string
  category: 'storage' | 'loop' | 'calldata' | 'packing' | 'other'
  estimated_savings: string
}

type GasProfileResult = {
  contracts: ContractGas[]
  total_gas: number
  optimization_hints: OptimizationHint[]
  error?: string
}

// Tool descriptor expected by MCP framework
export const toolSpec = {
  name: 'gas_profiler',
  description: 'Profile gas usage of smart contract functions and suggest optimizations.',
  inputSchema: {
    project_dir: 'string',
    contract_name: 'string'
  }
}

// Helpers
function walkDir(dir: string, fileCallback: (p: string) => void) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkDir(full, fileCallback)
    else fileCallback(full)
  }
}

function findSolFiles(projectDir: string): string[] {
  const solFiles: string[] = []
  walkDir(projectDir, (p) => {
    if (p.toLowerCase().endsWith('.sol')) solFiles.push(p)
  })
  return solFiles
}

async function locateContractContents(projectDir: string, contractName?: string): Promise<Array<{ path: string; content: string; name: string }>> {
  const results: Array<{ path: string; content: string; name: string }> = []
  const sols = findSolFiles(projectDir)

  // If a contract name is provided, try to locate a specific file first.
  if (contractName) {
    const exact = sols.find((p) => path.basename(p).toLowerCase() === `${contractName.toLowerCase()}.sol`)
    const candidatePaths: string[] = exact ? [exact] : sols
    for (const p of candidatePaths) {
      try {
        const content = fs.readFileSync(p, 'utf8')
        results.push({ path: p, content, name: contractName })
        // If we found a match, stop after first good one to avoid noisy results
        if (results.length > 0) break
      } catch {
        // ignore unreadable
      }
    }
  } else {
    // No specific contract requested; load all
    for (const p of sols) {
      try {
        const content = fs.readFileSync(p, 'utf8')
        const name = path.basename(p, '.sol')
        results.push({ path: p, content, name })
      } catch {
        // ignore unreadable
      }
    }
  }
  return results
}

function extractFunctionSignature(content: string, functionName: string): string | null {
  try {
    const re = new RegExp(`function\\s+${functionName}\\s*\\(([^)]*)\\)`, 's')
    const m = content.match(re)
    if (!m) return null
    return m[1] // parameter list
  } catch {
    return null
  }
}

function functionHasMemoryParams(content: string, functionName: string): boolean {
  const sig = extractFunctionSignature(content, functionName)
  if (!sig) return false
  return /\bmemory\b/.test(sig)
}

function contractHasSStore(content: string): boolean {
  return /\bSSTORE\b|\bsstore\b/.test(content)
}

function contractHasLoop(content: string): boolean {
  return /for\s*\(/.test(content) || /while\s*\(/.test(content)
}

function countSmallVarDeclarations(content: string): number {
  // crude heuristic: count common small-width types in storage declarations
  const re = /(uint8|uint16|uint24|uint32|bool|bytes1|bytes2|bytes3|bytes4|bytes5|bytes6|bytes7|bytes8|bytes9|bytes10)/g
  const matches = content.match(re)
  return matches ? matches.length : 0
}

// Main runner
export async function run(input: Input): Promise<GasProfileResult> {
  const { project_dir, contract_name } = input
  // 2. Run forge tests with gas report
  let stdout: string
  try {
    stdout = execSync('forge test --gas-report --json', {
      cwd: project_dir,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    })
  } catch (err: any) {
    // Friendly error if forge test fails
    const msg = err?.message ?? 'Forge test failed while collecting gas report.'
    return {
      contracts: [],
      total_gas: 0,
      optimization_hints: [],
      error: `Forge test failed: ${msg}`,
    }
  }

  // 3. Parse gas report JSON
  let report: any
  try {
    report = JSON.parse(stdout)
  } catch {
    // If forge prints JSON to a different stream, try to extract by locating first '{'
    const idx = stdout.indexOf('{')
    if (idx >= 0) {
      try {
        report = JSON.parse(stdout.slice(idx))
      } catch {
        report = null
      }
    } else {
      report = null
    }
  }

  if (!report) {
    // Friendly error
    return {
      contracts: [],
      total_gas: 0,
      optimization_hints: [],
    }
  }

  // Normalize structures
  const contractsRaw: any[] = Array.isArray(report.contracts) ? report.contracts : []
  let contracts: ContractGas[] = []
  for (const c of contractsRaw) {
    const name = c.name ?? ''
    const funcs: FunctionGas[] = Array.isArray(c.functions)
      ? c.functions.map((f: any) => {
          const calls = Number(f.calls ?? f.total_calls ?? 1)
          const avg_gas = Number(f.avg_gas ?? f.gas_avg ?? 0)
          const median_gas = Number(f.median_gas ?? f.gas_median ?? 0)
          const min_gas = Number(f.min_gas ?? f.gas_min ?? 0)
          const max_gas = Number(f.max_gas ?? f.gas_max ?? 0)
          return {
            name: f.name ?? '',
            calls,
            avg_gas,
            median_gas,
            min_gas,
            max_gas,
          }
        })
      : []
    contracts.push({ name, functions: funcs })
  }

  // total_gas: sum of (avg_gas * calls) for all functions
  let total_gas = 0
  for (const c of contracts) {
    for (const f of c.functions) {
      total_gas += f.avg_gas * Math.max(1, f.calls)
    }
  }

  // Build optimization hints (rule-based, no LLM)
  // We attempt to locate contract sources to inspect SSTORE/loops and param memory usage
  const sources = await locateContractContents(project_dir, contract_name)
  // Precompute flags per contract name based on sources
  const contractSourceMap: Record<string, string> = {}
  for (const s of sources) {
    if (s.name) contractSourceMap[s.name] = s.content
  }

  // heuristics utility
  const hints: OptimizationHint[] = []
  for (const c of contracts) {
    const src = contractSourceMap[c.name] || ''
    const hasSStore = contractHasSStore(src)
    const hasLoopInSrc = contractHasLoop(src)
    // per-function hints
    for (const f of c.functions) {
      // current gas reference
      const current_gas = f.avg_gas * Math.max(1, f.calls)

      // 4 categories; we append multiple hints per function for broad coverage
      // 1) storage
      if (hasSStore && current_gas > 50000) {
        hints.push({
          function_name: f.name,
          current_gas,
          hint: 'Consider using immutable or constant',
          category: 'storage',
          estimated_savings: 'roughly 20-40%',
        })
      }

      // 2) loop
      if (hasLoopInSrc && (f.avg_gas > 100000 || f.max_gas > 100000)) {
        hints.push({
          function_name: f.name,
          current_gas,
          hint: 'Consider bounding loop iterations',
          category: 'loop',
          estimated_savings: 'roughly 10-30%',
        })
      }

      // 3) calldata (read-only params should use calldata)
      if (functionHasMemoryParams(src, f.name)) {
        hints.push({
          function_name: f.name,
          current_gas,
          hint: 'Consider using calldata for read-only params',
          category: 'calldata',
          estimated_savings: 'roughly 5-15%',
        })
      }

      // 4) packing heuristic based on small var declarations in contract
      const smallVarCount = countSmallVarDeclarations(src)
      if (smallVarCount > 3 && current_gas > 20000) {
        hints.push({
          function_name: f.name,
          current_gas,
          hint: 'Consider variable packing',
          category: 'packing',
          estimated_savings: 'roughly 5-20%',
        })
      }

      // Fallback: if we haven't produced any hint yet for this function, emit a generic one
      const hasAnyHint = hints.find((h) => h.function_name === f.name)
      if (!hasAnyHint && current_gas > 80000) {
        hints.push({
          function_name: f.name,
          current_gas,
          hint: 'Consider reviewing gas usage for hotspots',
          category: 'other',
          estimated_savings: '5-15%',
        })
      }
    }
  }

  // 5. Assemble result
  const result: GasProfileResult = {
    contracts,
    total_gas,
    optimization_hints: hints,
  }
  // Return the structured result
  return result
}

export default run
