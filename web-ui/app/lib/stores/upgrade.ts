export type UpgradeMode = 'transparent' | 'uups' | 'beacon'
// Status values controlled by the wizard lifecycle
export type UpgradeStatus = 'idle' | 'generating' | 'deploying' | 'done'

export interface UpgradeState {
    upgradeMode: UpgradeMode
    upgradeStatus: UpgradeStatus
    contractName: string
    generatedCode: string
}

export const upgradeStore = {
    state: {
        upgradeMode: 'transparent' as UpgradeMode,
        upgradeStatus: 'idle' as UpgradeStatus,
        contractName: '',
        generatedCode: '',
    } as UpgradeState,
    
    listeners: [] as ((state: UpgradeState) => void)[],
    
    getState(): UpgradeState {
        return this.state
    },
    
    subscribe(listener: (state: UpgradeState) => void): () => void {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    },
    
    notify(): void {
        this.listeners.forEach(l => l(this.state))
    },
    
    setMode(mode: UpgradeMode): void {
        this.state.upgradeMode = mode
        this.notify()
    },
    
    setStatus(status: UpgradeStatus): void {
        this.state.upgradeStatus = status
        this.notify()
    },
    
    setContract(name: string): void {
        this.state.contractName = name
        this.notify()
    },
    
    setGeneratedCode(code: string): void {
        this.state.generatedCode = code
        this.notify()
    },
    
    // Optional: keep an error field in memory for debugging in the UI if needed in future
    setError(_error: string | null): void {
        // Currently no-op since we don't expose an error field in state
        this.notify()
    },
    
    reset(): void {
        this.state = {
            upgradeMode: 'transparent',
            upgradeStatus: 'idle',
            contractName: '',
            generatedCode: '',
            error: null,
        }
        this.notify()
    },
    
    async generateCode(): Promise<string> {
        this.setStatus('generating')
        this.setError(null)
        
        try {
            const resp = await fetch('/api/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: this.state.upgradeMode,
                    contractName: this.state.contractName,
                }),
            })
            
            if (!resp.ok) {
                throw new Error(`Failed to generate code: ${resp.statusText}`)
            }
            
            const data = await resp.json()
            this.setGeneratedCode(data.code || '')
            this.setStatus('idle')
            return data.code
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Unknown error'
            this.setError(error)
            throw e
        }
    },
}

export function useUpgradeStore() {
    return upgradeStore
}
