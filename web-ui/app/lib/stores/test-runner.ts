import { atom } from 'nanostores';
import type { ChainType } from '~/lib/stores/chain';
import { getTestCommand, type ParsedTestResults } from '~/lib/web3/test-runner';
import { analytics } from '~/lib/services/analytics';

export interface TestRunState {
  isRunning: boolean;
  chainType: ChainType;
  command: string;
  results: ParsedTestResults | null;
  error: string | null;
  lastRunAt: number | null;
}

const initialState: TestRunState = {
  isRunning: false,
  chainType: 'svm',
  command: getTestCommand('svm'),
  results: null,
  error: null,
  lastRunAt: null,
};

export const testRunStore = atom<TestRunState>(initialState);

export function startTestRun(chainType: ChainType, command: string) {
  analytics.testTriggered(chainType, false);
  testRunStore.set({
    ...testRunStore.get(),
    isRunning: true,
    chainType,
    command,
    error: null,
  });
}

export function completeTestRun(results: ParsedTestResults) {
  const success = results.passed > 0 && results.failed === 0;
  analytics.testTriggered(results.chainType, success);
  testRunStore.set({
    ...testRunStore.get(),
    isRunning: false,
    chainType: results.chainType,
    command: results.command,
    results,
    error: null,
    lastRunAt: Date.now(),
  });
}

export function failTestRun(error: string, chainType: ChainType, command: string) {
  analytics.testTriggered(chainType, false);
  testRunStore.set({
    ...testRunStore.get(),
    isRunning: false,
    chainType,
    command,
    error,
    lastRunAt: Date.now(),
  });
}
