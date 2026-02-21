// Upgrade store: holds mode and status for the upgrade wizard
export type UpgradeMode = 'transparent' | 'uups' | 'beacon'
export type UpgradeStatus = 'idle' | 'generating' | 'deploying' | 'done'

// Simple in-file store; in a real app this could be a global state (e.g. Zustand/Redux)
export const upgradeStore = {
  upgradeMode: 'transparent' as UpgradeMode,
  upgradeStatus: 'idle' as UpgradeStatus,
  contractName: '' as string,
  setMode(mode: UpgradeMode) {
    this.upgradeMode = mode
  },
  setStatus(status: UpgradeStatus) {
    this.upgradeStatus = status
  },
  setContract(name: string) {
    this.contractName = name
  }
}
