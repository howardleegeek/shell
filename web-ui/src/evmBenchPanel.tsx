import React, { useEffect, useState } from 'react'
import Driver from 'driver.js'
import 'driver.js/dist/driver.css'
import { parseGasReport } from './gasProfiler'
import { GasProfilerPanel } from './gasProfiler'

// Basic EVM Benchmark panel with interactive onboarding tour (Driver.js)
// - Paste a gas report and parse it into a visual panel
// - Load a sample report for quick testing
// Onboarding tour anchors are injected into the UI for step references
// Tour steps: 10 steps as described in the project spec
const TOUR_KEY = 'webui_tour_seen_v2'
let _guideDriver: any = null
const SAMPLE_GAS_REPORT = `Function: transfer\nGas: 21000\nFunction: approve\nGas: 15000`;

const EvmBenchPanel: React.FC = () => {
  const [text, setText] = useState<string>("")
  const [stats, setStats] = useState<any>(null)
  
  // Start interactive tour on first load. This runs once per user, controlled by localStorage flag.
  useEffect(() => {
    try {
      const seen = localStorage.getItem(TOUR_KEY)
      if (!seen) {
        startTour()
        localStorage.setItem(TOUR_KEY, '1')
      }
    } catch {
      // ignore storage errors in test environments
    }
  }, [])

  const startTour = () => {
    // Define 10 anchor elements on this panel to explain steps
    const steps = [
      { element: '#welcome', popover: { title: 'Welcome', description: 'Welcome to Shell, the Web3 Vibe Coding IDE' } },
      { element: '#guide-chain', popover: { title: 'Choose your chain', description: 'Select the chain: SVM or EVM' } },
      { element: '#guide-gallery', popover: { title: 'Templates Gallery', description: 'Pick a starter template to begin' } },
      { element: '#guide-ai', popover: { title: 'AI Chat', description: 'Describe what you want, and AI will generate it' } },
      { element: '#guide-editor', popover: { title: 'Code Editor', description: 'Review and edit generated code' } },
      { element: '#btn-build', popover: { title: 'Build', description: 'Build your contract with one click' } },
      { element: '#btn-test', popover: { title: 'Test', description: 'Run tests automatically' } },
      { element: '#btn-audit', popover: { title: 'Audit', description: 'Security scan before deploy' } },
      { element: '#btn-deploy', popover: { title: 'Deploy', description: 'Deploy to testnet' } },
      { element: '#guide-done', popover: { title: 'Done', description: 'You’re ready to start building Web3' } },
    ]

    try {
      // @ts-ignore
      _guideDriver = new Driver({ padding: 8 })
      // @ts-ignore
      _guideDriver.defineSteps(steps)
      // Start tour; elements must exist in DOM by render time
      // @ts-ignore
      _guideDriver.start()
    } catch (e) {
      // If driver fails (e.g., not yet mounted), ignore gracefully
      console.error('S28-tour: failed to start', e)
    }
  }

  // Quick anchor style for tour steps (hidden-ish visual anchors)
  const anchorStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: 3,
    display: 'inline-block',
    background: 'transparent',
    border: '1px solid rgba(0,255,0,0.6)',
    marginRight: 6,
  }

  // Reset tour on demand from settings button
  const resetTour = () => {
    try {
      localStorage.removeItem(TOUR_KEY)
      startTour()
      localStorage.setItem(TOUR_KEY, '1')
    } catch {
      // ignore errors
    }
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
        <div className="tour-anchors" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }} aria-label="tour-anchors">
          <div id="welcome" style={anchorStyle}></div>
          <div id="guide-chain" style={anchorStyle}></div>
          <div id="guide-gallery" style={anchorStyle}></div>
          <div id="guide-ai" style={anchorStyle}></div>
          <div id="guide-editor" style={anchorStyle}></div>
          <div id="btn-build" style={anchorStyle}></div>
          <div id="btn-test" style={anchorStyle}></div>
          <div id="btn-audit" style={anchorStyle}></div>
          <div id="btn-deploy" style={anchorStyle}></div>
          <div id="guide-done" style={anchorStyle}></div>
        </div>
        <button onClick={resetTour}>Reset Tutorial</button>
      </div>
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
