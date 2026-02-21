import React, { useCallback, useMemo, useState } from 'react'
import { useUpgradeStore, type UpgradeMode, type UpgradeStatus } from '~/lib/stores/upgrade'
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
    const store = useUpgradeStore()
    const [step, setStep] = useState<Step>(1)
    const [state, setState] = useState(store.getState())

    React.useEffect(() => store.subscribe(setState), [store])

    const selectMode = useCallback((mode: UpgradeMode) => {
        store.setMode(mode)
        store.setError(null)
        setStep(2)
    }, [store])

    const selectContract = useCallback((contractName: string) => {
        store.setContract(contractName)
        store.setError(null)
    }, [store])

    const goToStep3 = useCallback(() => {
        if (!state.contractName) {
            store.setError('Please select a contract')
            return
        }
        setStep(3)
    }, [state.contractName, store])

    const generatePreview = useCallback(async () => {
        if (!state.contractName) {
            store.setError('Please select a contract')
            return
        }
        await store.generateCode()
    }, [state.contractName, store])

    const goToStep4 = useCallback(() => {
        if (!state.generatedCode) {
            store.setError('Generate preview before deployment')
            return
        }
        setStep(4)
    }, [state.generatedCode, store])

    const handleDeploy = useCallback(async () => {
        await store.deploy(onDeploy)
    }, [store, onDeploy])

    const resetWizard = useCallback(() => {
        setStep(1)
        store.reset()
    }, [store])

    const statusLabel = useMemo<Record<UpgradeStatus, string>>(() => ({
        idle: 'Idle',
        generating: 'Generating preview...',
        deploying: 'Deploying...',
        done: 'Deployment complete',
    }), [])

    const mode = state.upgradeMode
    const contract = state.contractName
    const generatedCode = state.generatedCode
    const isGenerating = state.upgradeStatus === 'generating'
    const isDeploying = state.upgradeStatus === 'deploying'
    const error = state.error

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

            <div style={{ marginBottom: 12, fontSize: 13, color: '#4b5563' }}>
                Status: <strong>{statusLabel[state.upgradeStatus]}</strong>
            </div>

            {error ? (
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
            ) : null}

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
                                style={{
                                    padding: 20,
                                    border: mode === m ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    background: mode === m ? '#eff6ff' : '#fff',
                                    cursor: 'pointer',
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
                                style={{
                                    padding: '10px 20px',
                                    border: contract === c ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: 8,
                                    background: contract === c ? '#eff6ff' : '#fff',
                                    cursor: 'pointer',
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
                            onClick={generatePreview}
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
                            {isGenerating ? 'Generating...' : 'Generate Preview'}
                        </button>
                        <button
                            onClick={goToStep4}
                            disabled={!generatedCode || isGenerating}
                            style={{
                                padding: '10px 24px',
                                background: !generatedCode || isGenerating ? '#9ca3af' : '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: !generatedCode || isGenerating ? 'default' : 'pointer',
                                marginRight: 12,
                            }}
                        >
                            Continue to Deploy
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
                                background: isDeploying ? '#9ca3af' : '#7c3aed',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: isDeploying ? 'default' : 'pointer',
                            }}
                            disabled={isDeploying}
                        >
                            {isDeploying ? 'Deploying...' : 'Deploy Now'}
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
