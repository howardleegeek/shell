import { atom } from '../../../libs/nanostores'

// Simple live-reload feature store for contract development workflow.
// The real project would use nano-stores; this lightweight shim focuses on
// essential state for tests and UI wiring.

type Status = 'idle' | 'compiling' | 'deploying' | 'ready' | 'error'

export const liveReloadEnabled = atom<boolean>(false) as any
export const liveReloadStatus = atom<Status>('idle') as any
export const lastDeployAddress = atom<string | null>(null) as any

// Internal debounce state and a callback used by tests to simulate file changes
let changeDebounceTimer: any = null
let onChangeCallback: (() => void) | null = null

// Public: initialize watcher (no-op in this simplified environment).
export function initLiveReloadWatcher(paths: string[], onChange?: () => void) {
  onChangeCallback = onChange ?? null
  // In test environment we won't hook real fs watchers to avoid Node fs in tests.
  // Call simulateFileChange() from tests to drive the pipeline.
}

// Public: simulate a file change (used by tests to drive the pipeline deterministically)
export function simulateFileChange() {
  if (changeDebounceTimer) {
    clearTimeout(changeDebounceTimer)
  }
  // 1s debounce to mimic real file-watching debounce
  changeDebounceTimer = setTimeout(async () => {
    // Respect the enable flag; if disabled, stay idle
    if (!liveReloadEnabled.get()) {
      liveReloadStatus.set('idle')
      lastDeployAddress.set(null)
      return
    }
    try {
      liveReloadStatus.set('compiling')
      // simulate compile time
      await new Promise((r) => setTimeout(r, 100))
      liveReloadStatus.set('deploying')
      // simulate deployment time
      await new Promise((r) => setTimeout(r, 300))
      // deployment succeeded; store a new dummy address
      const addr = '0x' + Math.floor(Math.random() * 1e16).toString(16).padStart(40, '0')
      lastDeployAddress.set(addr)
      liveReloadStatus.set('ready')
    } catch (e) {
      liveReloadStatus.set('error')
    }
  }, 1000)
}

// Tests can call this to reset the state
export function resetLiveReload() {
  if (changeDebounceTimer) {
    clearTimeout(changeDebounceTimer)
    changeDebounceTimer = null
  }
  liveReloadEnabled.set(false as any)
  liveReloadStatus.set('idle' as any)
  lastDeployAddress.set(null as any)
}
