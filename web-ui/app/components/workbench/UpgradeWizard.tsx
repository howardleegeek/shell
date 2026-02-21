import React, { useEffect, useMemo, useState } from 'react'

type UpgradeMode = 'transparent' | 'uups' | 'beacon'
type Step = 1 | 2 | 3 | 4

// Simple Upgrade Wizard: 4 steps as per spec
export default function UpgradeWizard() {
  const [step, setStep] = useState<Step>(1)
  const [mode, setMode] = useState<UpgradeMode | null>(null)
  const [contract, setContract] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const availableContracts = useMemo(() => ['Market', 'Token', 'DAO'], [])

  // Step 1: select mode
  const selectMode = (m: UpgradeMode) => {
    setMode(m)
    // advance to next step when a mode is selected
    setStep(2)
  }

  // Step 2: select contract
  const selectContract = (c: string) => {
    setContract(c)
    setStep(3)
  }

  // Step 3: preview generated code via API (mocked by local generator for now)
  const preview = async () => {
    if (!mode || !contract) return
    try {
      const resp = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' as const },
        body: JSON.stringify({ mode, contract }),
      })
      if (!resp.ok) throw new Error('Failed to generate code')
      const data = await resp.json()
      setGeneratedCode(data.code)
      setStep(4)
    } catch (e) {
      // fallback: simple placeholder
      setGeneratedCode(`// Generated code for ${contract} with mode ${mode}`)
      setStep(4)
    }
  }

  // Step 4: Deploy (stub)
  const deploy = () => {
    // In a real app this would trigger S10 deploy; here we just show a success hint
    alert('Deploy triggered (mock)')
  }

  return (
    <div className="upgrade-wizard" style={{ padding: 16, maxWidth: 800 }}>
      <h3>Contract Upgrade Wizard</h3>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {/* Step 1: Modes */}
        <section style={{ flex: 1 }} aria-label="select-mode">
          <h4>Step 1: Choose upgrade mode</h4>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {(['transparent', 'uups', 'beacon'] as UpgradeMode[]).map((m) => (
              <button key={m} onClick={() => selectMode(m)} style={{ padding: 12 }}>
                {m === 'transparent' ? 'Transparent Proxy' : m === 'uups' ? 'UUPS Proxy' : 'Beacon Proxy'}
              </button>
            ))}
          </div>
        </section>
      </div>

      {step >= 2 && (
        <section style={{ marginTop: 16 }} aria-label="select-contract">
          <h4>Step 2: Select contract to upgrade</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {availableContracts.map((c) => (
              <button key={c} onClick={() => selectContract(c)} style={{ padding: 8 }}>
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {step >= 3 && (
        <section style={{ marginTop: 16 }} aria-label="preview">
          <h4>Step 3: Preview generated code</h4>
          <button onClick={preview} style={{ padding: 8, marginTop: 8 }}>Generate Preview</button>
          {generatedCode && (
            <pre style={{ marginTop: 8, padding: 8, background: '#f6f6f6' }}>{generatedCode}</pre>
          )}
        </section>
      )}

      {step >= 4 && (
        <section style={{ marginTop: 16 }} aria-label="deploy">
          <h4>Step 4: Deploy</h4>
          <button onClick={deploy} style={{ padding: 8 }}>Deploy Now</button>
        </section>
      )}
    </div>
  )
}
