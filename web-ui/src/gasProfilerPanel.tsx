import React from 'react'
import { GasFuncStat, gasHeatColor, ComputeStat } from './gasProfiler'

export function GasProfilerPanel({ stats, computeStats }: { stats: GasFuncStat[]; computeStats?: ComputeStat[] }): JSX.Element {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 12, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Gas Profiler</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Function</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>avg</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>max</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.name} style={{ background: gasHeatColor(s.avg, s.max) }}>
              <td style={{ padding: '4px 8px' }}>{s.name}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>{s.avg.toLocaleString()}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>{s.max.toLocaleString()}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                {typeof s.delta === 'number' ? (s.delta > 0 ? '+' : '') + s.delta + '%' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {computeStats && computeStats.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Compute Profiler</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Instruction</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>compute</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {computeStats.map((s) => (
                <tr key={s.name} style={{ background: gasHeatColor(s.compute, s.compute * 2) }}>
                  <td style={{ padding: '4px 8px' }}>{s.name}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{s.compute.toLocaleString()}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    {typeof s.delta === 'number' ? (s.delta > 0 ? '+' : '') + s.delta + '%' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button onClick={() => alert('AI optimization will run here')} style={{ padding: '6px 12px' }}>
          Optimize with AI
        </button>
      </div>
    </div>
  )
}

export default GasProfilerPanel
