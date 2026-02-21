import React, { useCallback, useEffect, useMemo, useState } from 'react'

type UpgradeMode = 'transparent' | 'uups' | 'beacon'
type Step = 1 | 2 | 3 | 4

interface UpgradeWizardProps {
    onDeploy?: () => void
    availableContracts?: string[]
}

const modeDescriptions: Record<UpgradeMode, { title: string; desc: string }> = {
    transparent: {
        title: 'Transparent Proxy',
        desc: 'Best for most cases. Separate admin address for proxy management.',
    },
    uups: {
        title: 'UUPS Proxy',
        desc: 'Minimal gas cost. Upgrade logic in implementation contract.',
    },
    beacon: {
        title: 'Beacon Proxy',
        desc: 'Multiple proxies can point to same implementation. Great for proxies.',
    },
}

export default function UpgradeWizard({ 
    onDeploy,
    availableContracts = ['Market', 'Token', 'DAO', 'Vault', 'Staking']
}: UpgradeWizardProps) {
    const [step, setStep] = useState<Step>(1)
    const [mode, setMode] = useState<UpgradeMode | null>(null)
    const [contract, setContract] = useState<string>('')
    const [generatedCode, setGeneratedCode] = useState<string>('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const selectMode = useCallback((m: UpgradeMode) => {
        setMode(m)
        setError(null)
        setStep(2)
    }, [])

    const selectContract = useCallback((c: string) => {
        setContract(c)
        setError(null)
    }, [])

    const goToStep3 = useCallback(() => {
        if (!contract) {
            setError('Please select a contract')
            return
        }
        setStep(3)
        setError(null)
    }, [contract])

    const goToStep4 = useCallback(() => {
        if (!mode || !contract) return
        setIsGenerating(true)
        setError(null)
        
        fetch('/api/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, contractName: contract }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                setError(data.error)
                setGeneratedCode(data.fallback || '')
            } else {
                setGeneratedCode(data.code || '')
            }
            setIsGenerating(false)
        })
        .catch(e => {
            setError(e.message || 'Failed to generate code')
            setGeneratedCode(`// Generated code for ${contract} with mode ${mode}`)
            setIsGenerating(false)
        })
    }, [mode, contract])

    const handleDeploy = useCallback(() => {
        setStep(4)
        if (onDeploy) {
            onDeploy()
        }
    }, [onDeploy])

    const resetWizard = useCallback(() => {
        setStep(1)
        setMode(null)
        setContract('')
        setGeneratedCode('')
        setError(null)
    }, [])

    return (
        <div className="upgrade-wizard" style={{ 
            padding: 20, 
            maxWidth: 900, 
            margin: '0 auto',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 24 
            }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    Contract Upgrade Wizard
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4].map(s => (
                        <div
                            key={s}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: step >= s ? '#3b82f6' : '#e5e7eb',
                                color: step >= s ? '#fff' : '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {s}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#dc2626',
                    marginBottom: 16,
                    fontSize: 14,
                }}>
                    {error}
                </div>
            )}

            {step >= 1 && (
                <section style={{ marginBottom: 24 }} aria-label="select-mode">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 500, color: '#374151' }}>
                        Step 1: Choose upgrade mode
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {(['transparent', 'uups', 'beacon'] as UpgradeMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => selectMode(m)}
                                disabled={step > 1}
                                style={{
                                    padding: 20,
                                    border: mode === m ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    background: mode === m ? '#eff6ff' : '#fff',
                                    cursor: step > 1 ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ 
                                    fontWeight: 600, 
                                    fontSize: 16, 
                                    marginBottom: 8,
                                    color: '#111827'
                                }}>
                                    {modeDescriptions[m].title}
                                </div>
                                <div style={{ 
                                    fontSize: 13, 
                                    color: '#6b7280',
                                    lineHeight: 1.4
                                }}>
                                    {modeDescriptions[m].desc}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {step >= 2 && (
                <section style={{ marginBottom: 24 }} aria-label="select-contract">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 500, color: '#374151' }}>
                        Step 2: Select contract to upgrade
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {availableContracts.map((c) => (
                            <button
                                key={c}
                                onClick={() => selectContract(c)}
                                disabled={step > 2}
                                style={{
                                    padding: '10px 20px',
                                    border: contract === c ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: 8,
                                    background: contract === c ? '#eff6ff' : '#fff',
                                    cursor: step > 2 ? 'default' : 'pointer',
                                    fontSize: 14,
                                    fontWeight: contract === c ? 500 : 400,
                                    color: '#111827',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <button
                            onClick={goToStep3}
                            disabled={!contract}
                            style={{
                                padding: '10px 24px',
                                background: contract ? '#3b82f6' : '#9ca3af',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: contract ? 'pointer' : 'default',
                            }}
                        >
                            Continue to Preview
                        </button>
                    </div>
                </section>
            )}

            {step >= 3 && (
                <section style={{ marginBottom: 24 }} aria-label="preview">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 500, color: '#374151' }}>
                        Step 3: Preview generated code
                    </h4>
                    <div style={{ marginBottom: 12 }}>
                        <button
                            onClick={goToStep4}
                            disabled={isGenerating}
                            style={{
                                padding: '10px 24px',
                                background: isGenerating ? '#9ca3af' : '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: isGenerating ? 'default' : 'pointer',
                                marginRight: 12,
                            }}
                        >
                            {isGenerating ? 'Generating...' : 'Generate Code'}
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            style={{
                                padding: '10px 24px',
                                background: '#fff',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Back
                        </button>
                    </div>
                    {generatedCode && (
                        <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '8px 16px',
                                background: '#f9fafb',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 13,
                                fontWeight: 500,
                                color: '#6b7280',
                            }}>
                                Generated Proxy Contract
                            </div>
                            <pre style={{
                                margin: 0,
                                padding: 16,
                                background: '#1e1e1e',
                                color: '#d4d4d4',
                                fontSize: 13,
                                lineHeight: 1.5,
                                overflow: 'auto',
                                maxHeight: 400,
                            }}>
                                {generatedCode}
                            </pre>
                        </div>
                    )}
                </section>
            )}

            {step >= 4 && (
                <section style={{ marginBottom: 24 }} aria-label="deploy">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 500, color: '#374151' }}>
                        Step 4: Deploy Upgrade
                    </h4>
                    <div style={{
                        padding: 20,
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 12,
                        marginBottom: 16,
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: '#166534' }}>
                            Ready to deploy
                        </div>
                        <div style={{ fontSize: 14, color: '#15803d' }}>
                            Contract: <strong>{contract}</strong> with <strong>{mode}</strong> proxy
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={handleDeploy}
                            style={{
                                padding: '12px 32px',
                                background: '#7c3aed',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Deploy Now
                        </button>
                        <button
                            onClick={resetWizard}
                            style={{
                                padding: '12px 24px',
                                background: '#fff',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Start Over
                        </button>
                    </div>
                </section>
            )}
        </div>
    )
}
