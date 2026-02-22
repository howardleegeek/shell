export type UpgradeMode = 'transparent' | 'uups' | 'beacon'
// Status values controlled by the wizard lifecycle
export type UpgradeStatus = 'idle' | 'generating' | 'deploying' | 'done'

export interface UpgradeState {
    upgradeMode: UpgradeMode
    upgradeStatus: UpgradeStatus
    contractName: string
    generatedCode: string
    error: string | null
}

export const upgradeStore = {
    state: {
        upgradeMode: 'transparent' as UpgradeMode,
        upgradeStatus: 'idle' as UpgradeStatus,
        contractName: '',
        generatedCode: '',
        error: null,
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
        this.state.generatedCode = ''
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
    
    setError(error: string | null): void {
        this.state.error = error
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
            this.setStatus('idle')
            throw e
        }
    },

    async deploy(onDeploy?: () => void | Promise<void>): Promise<void> {
        this.setStatus('deploying')
        this.setError(null)

        try {
            if (onDeploy) {
                await onDeploy()
            }
            this.setStatus('done')
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Failed to deploy upgrade'
            this.setError(error)
            this.setStatus('idle')
            throw e
        }
    },
}

export function useUpgradeStore() {
    return upgradeStore
}
