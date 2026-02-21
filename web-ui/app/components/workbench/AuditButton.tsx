import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { chainStore, type ChainType } from '~/lib/stores/chain';
import { workbenchStore } from '~/lib/stores/workbench';
import { getAuditCommand, parseAuditResults, type ParsedAuditResults } from '~/lib/web3/audit-parser';
import { createScopedLogger } from '~/utils/logger';
import { autoRepairStore, recordAuditAttempt } from '~/lib/stores/auto-repair';

const logger = createScopedLogger('AuditButton');
const SHELL_READY_TIMEOUT_MS = 15_000;

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

export interface AuditRunState {
  isRunning: boolean;
  chainType: ChainType;
  command: string;
  results: ParsedAuditResults | null;
  error: string | null;
  lastRunAt: number | null;
}

export function AuditButton() {
  const chainState = useStore(chainStore);
  const repairState = useStore(autoRepairStore);

  const chainType: ChainType = chainState?.chainType ?? 'svm';

  const runAudit = useCallback(async () => {
    const command = getAuditCommand(chainType);

    try {
      workbenchStore.setShowWorkbench(true);
      workbenchStore.toggleTerminal(true);

      await waitForBoltShellReady();

      const execution = await workbenchStore.boltTerminal.executeCommand(`audit-run-${Date.now()}`, command);

      if (!execution) {
        throw new Error('Unable to access terminal execution context.');
      }

      const results = parseAuditResults(execution.output || '', chainType);

      if (repairState.phase.includes('audit') || repairState.phase === 'auditing') {
        recordAuditAttempt(results);
      }

      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run audit';
      logger.error('Failed to run audit:', error);
      throw error;
    }
  }, [chainType, repairState.phase]);

  const isRunning = repairState.phase === 'auditing' || repairState.phase === 'repairing_audit';

  return (
    <button
      onClick={runAudit}
      disabled={isRunning}
      className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs border border-orange-500/70 bg-[#0c0a09] text-[#fed7aa] hover:text-[#ffedd5] [&:not(:disabled,.disabled)]:hover:bg-[#1c1917] [&:not(:disabled,.disabled)]:hover:shadow-[0_0_16px_rgba(249,115,22,0.45)] outline-orange-500 flex gap-1.5 transition-all duration-150"
      title={`Run ${chainType.toUpperCase()} security audit`}
      type="button"
    >
      <div className={isRunning ? 'i-ph:spinner-gap animate-spin' : 'i-ph:shield-check'} />
      <span>{isRunning ? 'Auditing' : 'Audit'}</span>
    </button>
  );
}
