import { useStore } from '@nanostores/react';
import { chainStore, type ChainType } from '~/lib/stores/chain';
import { completeTestRun, failTestRun, startTestRun, testRunStore } from '~/lib/stores/test-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { getTestCommand, parseTestResults } from '~/lib/web3/test-runner';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('TestButton');
const SHELL_READY_TIMEOUT_MS = 10_000;

async function waitForBoltShellReady() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      workbenchStore.boltTerminal.ready(),
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Terminal is still initializing. Please try again in a moment.'));
        }, SHELL_READY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function TestButton() {
  const chainState = useStore(chainStore);
  const testRun = useStore(testRunStore);

  const chainType: ChainType = chainState?.chainType ?? 'svm';

  const runTests = async () => {
    if (testRun.isRunning) {
      return;
    }

    const command = getTestCommand(chainType);
    startTestRun(chainType, command);

    try {
      workbenchStore.setShowWorkbench(true);
      workbenchStore.toggleTerminal(true);

      await waitForBoltShellReady();

      const execution = await workbenchStore.boltTerminal.executeCommand(`test-run-${Date.now()}`, command);

      if (!execution) {
        throw new Error('Unable to access terminal execution context.');
      }

      let parsedResults = parseTestResults(execution.output || '', chainType);

      if (execution.exitCode !== 0 && parsedResults.failed === 0) {
        parsedResults = {
          ...parsedResults,
          failed: 1,
          total: Math.max(parsedResults.total, parsedResults.passed + 1),
          tests:
            parsedResults.tests.length > 0
              ? parsedResults.tests
              : [
                  {
                    name: `${chainType.toUpperCase()} test run exited with code ${execution.exitCode}`,
                    status: 'fail',
                    details: `Command: ${command}`,
                  },
                ],
        };
      }

      completeTestRun(parsedResults);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run tests';
      logger.error('Failed to run tests:', error);
      failTestRun(message, chainType, command);
    }
  };

  return (
    <button
      onClick={runTests}
      disabled={testRun.isRunning}
      className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs border border-[#39ff14]/70 bg-[#041109] text-[#b2ffbf] hover:text-[#d3ffda] [&:not(:disabled,.disabled)]:hover:bg-[#0a1f12] [&:not(:disabled,.disabled)]:hover:shadow-[0_0_16px_rgba(57,255,20,0.45)] outline-[#39ff14] flex gap-1.5 transition-all duration-150"
      title={`Run ${chainType.toUpperCase()} tests`}
      type="button"
      data-tour="test"
    >
      <div className={testRun.isRunning ? 'i-ph:spinner-gap animate-spin' : 'i-ph:flask'} />
      <span>{testRun.isRunning ? 'Running' : 'Test'}</span>
    </button>
  );
}
