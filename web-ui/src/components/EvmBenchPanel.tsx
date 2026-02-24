import React, { useState } from 'react'

type EvmBenchPanelProps = {
  /** Optional runner that will execute the benchmark and return results. */
  onRun?: (config?: { fuzzRuns?: number }) => Promise<any>
  /** Default number of fuzz runs for the panel UI */
  defaultFuzzRuns?: number
}

type BenchmarkResult = any

// A lightweight EVM Benchmark panel. This is intentionally front-end only
// and delegates heavy lifting to the provided onRun callback when available.
export const EvmBenchPanel: React.FC<EvmBenchPanelProps> = ({ onRun, defaultFuzzRuns = 1000 }) => {
  const [fuzzRuns, setFuzzRuns] = useState<number>(defaultFuzzRuns)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<BenchmarkResult | null>(null)

  const runBenchmark = async () => {
    setLoading(true)
    try {
      const cfg = { fuzzRuns }
      const res = await (onRun ? onRun(cfg) : Promise.resolve(null))
      setResults(res)
    } catch (err) {
      // keep interface simple for now; in a real app we'd surface the error
      setResults({ ok: false, error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }} aria-label="evm-bench-panel">
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>EVM Benchmark</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <label>
          Fuzz Runs:
          <input
            type="number"
            min={1}
            value={fuzzRuns}
            onChange={(e) => setFuzzRuns(Number(e.target.value))}
            style={{ width: 120, marginLeft: 6, padding: 6 }}
          />
        </label>
        <button onClick={runBenchmark} disabled={loading} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
          {loading ? 'Running…' : 'Run Benchmark'}
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        {results ? (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#e5e7eb', padding: 12, borderRadius: 6 }}>
{JSON.stringify(results, null, 2)}
          </pre>
        ) : (
          <div style={{ color: '#93a3b8' }}>No results yet. Click Run Benchmark to start.</div>
        )}
      </div>
    </div>
  )
}

export default EvmBenchPanel
