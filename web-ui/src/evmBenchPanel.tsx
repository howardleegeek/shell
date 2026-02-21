import React, { useState } from 'react'
import { parseGasReport } from './gasProfiler'
import { GasProfilerPanel } from './gasProfiler'

// Basic EVM Benchmark panel
// - Paste a gas report and parse it into a visual panel
// - Load a sample report for quick testing
const SAMPLE_GAS_REPORT = `Function: transfer\nGas: 21000\nFunction: approve\nGas: 15000`;

const EvmBenchPanel: React.FC = () => {
  const [text, setText] = useState<string>("")
  const [stats, setStats] = useState<any>(null)

  const onParse = () => {
    const input = text && text.trim().length > 0 ? text : SAMPLE_GAS_REPORT
    try {
      const result = parseGasReport(input) // parseGasReport is tolerant to input variations
      setStats(result)
    } catch (err) {
      // keep UI responsive even if parsing fails
      console.error('S28-evm-bench: parseGasReport error', err)
      setStats(null)
    }
  }

  return (
    <section className="evm-bench-panel" aria-label="EVM Benchmark Panel">
      <h2>EVM Benchmark</h2>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste Foundry/forge gas report here"
          rows={8}
          style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
        />
        <button onClick={() => setText(SAMPLE_GAS_REPORT)}>Load Sample</button>
        <button onClick={onParse}>Parse</button>
      </div>

      {stats ? (
        // Render the parsed profiler panel if available
        // Casting to any to avoid strict coupling with GasProfilerPanel props in this isolated patch
        <GasProfilerPanel stats={stats as any} />
      ) : (
        <div style={{ marginTop: 8, color: '#666' }}>
          No parsed data yet. Paste a gas report and press Parse.
        </div>
      )}
    </section>
  )
}

export default EvmBenchPanel
