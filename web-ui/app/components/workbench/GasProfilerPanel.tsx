import React, { useEffect, useMemo, useState } from 'react'
import { parseGasReport, parseComputeReport, colorForGas, generateAiSuggestions, formatNumber } from '../lib/gasProfiler'

type GasFn = { name: string; min: number; avg: number; max: number; calls: number; delta?: number }
type ComputeInstr = { instruction: string; compute: number }

interface Props {
  report?: string
  computeReport?: string
}

export const GasProfilerPanel: React.FC<Props> = ({ report, computeReport }) => {
  const [rows, setRows] = useState<GasFn[]>([])
  const [compute, setCompute] = useState<ComputeInstr[]>([])
  const [ai, setAi] = useState<string[]>([])

  // Parse gas report and compute deltas against last run stored in localStorage
  useEffect(() => {
    if (report) {
      const parsed = parseGasReport(report) as GasFn[]
      // Restore previous baseline
      let baseline: Record<string, GasFn> | null = null
      try {
        const raw = localStorage.getItem('gasProfiler_prev')
        if (raw) baseline = JSON.parse(raw)
      } catch {
        baseline = null
      }
      // compute delta against baseline by function name
      const withDelta = parsed.map(p => {
        const prev = baseline?.[p.name]
        const delta = prev && prev.avg > 0 ? Math.round(((p.avg - prev.avg) / prev.avg) * 100) : 0
        return { ...p, delta }
      })
      setRows(withDelta)
      // Persist current as baseline
      try {
        const next = Object.fromEntries(withDelta.map(r => [r.name, r]))
        localStorage.setItem('gasProfiler_prev', JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      // AI suggestions
      setAi(generateAiSuggestions(withDelta))
    }
  }, [report])

  useEffect(() => {
    if (computeReport) {
      setCompute(parseComputeReport(computeReport))
    }
  }, [computeReport])

  const totalDeployment = useMemo(() => {
    // simple sum of avg gas as a surrogate total deployment estimate
    return rows.reduce((acc, r) => acc + (Number(r.avg) || 0), 0)
  }, [rows])

  return (
    <section style={{ padding: 12 }}>
      <h3 style={{ margin: '8px 0' }}>Gas Profiler</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Function</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>Min</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>Avg</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>Max</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>Calls</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} style={{ backgroundColor: colorForGas(r.avg), color: '#000' }}>
                <td style={{ padding: '6px 8px' }}>{r.name}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.min.toLocaleString()}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.avg.toLocaleString()}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.max.toLocaleString()}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.calls}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.delta != null ? (r.delta >= 0 ? '+' : '') + r.delta + '%' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <button style={{ padding: '6px 12px' }} onClick={() => { /* placeholder AI action */ }}>
          Optimize with AI
        </button>
      </div>

      {ai.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>AI Suggestions</strong>
          <ul>
            {ai.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
        Total deployment gas (proxy): {formatNumber(totalDeployment)}
      </div>

      {compute.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h4 style={{ margin: 0 }}>Compute Profiler</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Instruction</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Compute</th>
              </tr>
            </thead>
            <tbody>
              {compute.map((c) => (
                <tr key={c.instruction}>
                  <td style={{ padding: '6px 8px' }}>{c.instruction}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{c.compute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </section>
  )
}

export default GasProfilerPanel
