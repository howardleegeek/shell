import { atom } from 'nanostores'

export type FuzzReport = {
  totalRuns: number
  doneRuns: number
  failures: number
  counterexamples: any[]
  startedAt?: string
  finishedAt?: string
  status?: string
}

// Fuzz running status: idle | running | done | error
export const fuzzStatus = atom<string>('idle')

export const fuzzResults = atom<FuzzReport>({
  totalRuns: 0,
  doneRuns: 0,
  failures: 0,
  counterexamples: [],
})
