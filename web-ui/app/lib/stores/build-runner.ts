import { atom } from 'nanostores';
import type { ChainType } from '~/lib/stores/chain';

export type BuildStatus = 'idle' | 'building' | 'success' | 'failed';

export interface BuildRunState {
  status: BuildStatus;
  chainType: ChainType;
  command: string;
  error: string | null;
  lastRunAt: number | null;
}

const initialState: BuildRunState = {
  status: 'idle',
  chainType: 'svm',
  command: 'anchor build',
  error: null,
  lastRunAt: null,
};

export const buildRunStore = atom<BuildRunState>(initialState);

export function startBuildRun(chainType: ChainType, command: string) {
  buildRunStore.set({
    ...buildRunStore.get(),
    status: 'building',
    chainType,
    command,
    error: null,
  });
}

export function completeBuildRun(chainType: ChainType, command: string) {
  buildRunStore.set({
    ...buildRunStore.get(),
    status: 'success',
    chainType,
    command,
    error: null,
    lastRunAt: Date.now(),
  });
}

export function failBuildRun(chainType: ChainType, command: string, error: string) {
  buildRunStore.set({
    ...buildRunStore.get(),
    status: 'failed',
    chainType,
    command,
    error,
    lastRunAt: Date.now(),
  });
}
