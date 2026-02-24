import React, { useState } from 'react'

type GasFunctionEntry = {
  name: string
  min: number
  avg: number
  max: number
  calls: number
  delta?: string
}

type GasProfileResult = {
  gasReport?: { functions: GasFunctionEntry[] }
  totalDeploymentGas?: number
  estimatedCost?: string
}

type GasProfilerPanelProps = {
  /** Callback to run the profiling; should return a GasProfileResult */
  onRun?: (config?: { dryRun?: boolean }) => Promise<GasProfileResult>
  /** Optional default value to seed the UI with a mock run */
  defaultSeed?: GasProfileResult
}

// A lightweight Gas Profiler panel for the web UI.
// This component is intentionally small and delegates heavy lifting to onRun.
export const GasProfilerPanel: React.FC<GasProfilerPanelProps> = ({ onRun, defaultSeed }) => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GasProfileResult | null>(defaultSeed ?? null)

  const runProfiler = async () => {
    setLoading(true)
    try {
      const res = await (onRun ? onRun({ dryRun: false }) : Promise.resolve(null))
      setResults(res)
    } catch (err) {
      // surface error in a minimal way for the demo
      setResults({ gasReport: [{ name: 'error', min: 0, avg: 0, max: 0, calls: 0 }] as any })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }} aria-label="gas-profiler-panel">
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Gas Profiler</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={runProfiler} disabled={loading} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
          {loading ? 'Running…' : 'Run Gas Profiling'}
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        {results ? (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#e5e7eb', padding: 12, borderRadius: 6 }}>
{JSON.stringify(results, null, 2)}
          </pre>
        ) : (
          <div style={{ color: '#93a3b8' }}>No results yet. Click Run Gas Profiling to start.</div>
        )}
      </div>
    </div>
  )
}

export default GasProfilerPanel
