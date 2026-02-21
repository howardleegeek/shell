import { atom } from 'nanostores'

// UI state for fuzz testing in the IDE
export type Counterexample = {
  id?: string
  contract?: string
  input?: string
  expected?: string
  actual?: string
}

export type FuzzResultState = {
  totalRuns: number
  completedRuns: number
  failures: number
  counterexamples: Counterexample[]
}

export const fuzzStatus = atom<'idle' | 'running' | 'done' | 'error'>('idle')
export const fuzzResults = atom<FuzzResultState>({
  totalRuns: 0,
  completedRuns: 0,
  failures: 0,
  counterexamples: [],
})
