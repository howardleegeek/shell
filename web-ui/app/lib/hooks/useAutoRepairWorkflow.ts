import { useCallback, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  autoRepairStore,
  startWorkflow,
  setPhase,
  recordBuildAttempt,
  recordTestAttempt,
  recordAuditAttempt,
  startRepairing,
  canRetry,
  getFailedTestsForRepair,
  getCriticalAuditFindingsForRepair,
} from '~/lib/stores/auto-repair';
import { chainStore, type ChainType } from '~/lib/stores/chain';
import { workbenchStore } from '~/lib/stores/workbench';
import { getTestCommand, parseTestResults } from '~/lib/web3/test-runner';
import { getAuditCommand, parseAuditResults } from '~/lib/web3/audit-parser';
import { chatStore } from '~/lib/stores/chat';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AutoRepairWorkflow');
const SHELL_READY_TIMEOUT_MS = 15_000;

interface RepairContext {
  phase: 'build' | 'test' | 'audit';
  failures: Array<{ name: string; details?: string; location?: string }>;
  chainType: ChainType;
}

async function waitForBoltShellReady(): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      workbenchStore.boltTerminal.ready(),
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Terminal initialization timeout'));
        }, SHELL_READY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function useAutoRepairWorkflow() {
  const state = useStore(autoRepairStore);
  const chainState = useStore(chainStore);
  const abortControllerRef = useRef<AbortController | null>(null);

  const chainType: ChainType = chainState?.chainType ?? 'svm';

  const generateRepairPrompt = useCallback((context: RepairContext): string => {
    const { phase, failures, chainType } = context;

    const failureDescriptions = failures.map((f, i) => {
      let desc = `${i + 1}. ${f.name}`;
      if (f.details) desc += `\n   Error: ${f.details}`;
      if (f.location) desc += `\n   Location: ${f.location}`;
      return desc;
    }).join('\n\n');

    switch (phase) {
      case 'build':
        return `The project build failed with the following errors:\n\n${failureDescriptions}\n\nPlease analyze the build errors and fix the issues. The chain type is ${chainType.toUpperCase()}. Provide only the necessary code changes to resolve the build failures.`;

      case 'test':
        return `The following tests failed:\n\n${failureDescriptions}\n\nChain type: ${chainType.toUpperCase()}\n\nPlease analyze the test failures and fix the code. Focus on the specific test cases that failed and ensure the logic is correct. Provide only the necessary code changes to make the tests pass.`;

      case 'audit':
        return `Security audit found the following critical/high severity issues:\n\n${failureDescriptions}\n\nChain type: ${chainType.toUpperCase()}\n\nPlease fix these security vulnerabilities. Focus on addressing the specific issues found. Provide only the necessary code changes to resolve the security findings.`;
    }
  }, []);

  const sendRepairRequest = useCallback(async (context: RepairContext) => {
    const prompt = generateRepairPrompt(context);
    const messages = chatStore.get().messages;

    chatStore.setKey('messages', [
      ...messages,
      {
        id: `repair-${Date.now()}`,
        role: 'user',
        content: prompt,
        createdAt: new Date().toISOString(),
      },
    ]);

    return true;
  }, [generateRepairPrompt]);

  const runBuildPhase = useCallback(async (): Promise<boolean> => {
    setPhase('building');

    try {
      await waitForBoltShellReady();

      const buildCommand = chainType === 'evm' ? 'forge build' : 'anchor build';
      const execution = await workbenchStore.boltTerminal.executeCommand(
        `build-${Date.now()}`,
        buildCommand
      );

      if (!execution) {
        throw new Error('Build execution failed');
      }

      const success = execution.exitCode === 0;

      recordBuildAttempt(success, success ? undefined : execution.output?.slice(-500));

      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Build failed';
      recordBuildAttempt(false, message);
      return false;
    }
  }, [chainType]);

  const runTestPhase = useCallback(async (): Promise<boolean> => {
    setPhase('testing');

    try {
      await waitForBoltShellReady();

      const command = getTestCommand(chainType);
      const execution = await workbenchStore.boltTerminal.executeCommand(
        `test-${Date.now()}`,
        command
      );

      if (!execution) {
        throw new Error('Test execution failed');
      }

      const results = parseTestResults(execution.output || '', chainType);

      if (execution.exitCode !== 0 && results.failed === 0) {
        results.failed = 1;
        results.total = Math.max(results.total, results.passed + 1);
        if (results.tests.length === 0) {
          results.tests.push({
            name: 'Test execution',
            status: 'fail',
            details: `Exit code: ${execution.exitCode}`,
          });
        }
      }

      recordTestAttempt(results);

      return results.failed === 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test run failed';
      const failedResults: ReturnType<typeof parseTestResults> = {
        chainType,
        command: getTestCommand(chainType),
        passed: 0,
        failed: 1,
        total: 1,
        tests: [{
          name: 'Test execution',
          status: 'fail',
          details: message,
        }],
        rawOutput: message,
      };
      recordTestAttempt(failedResults);
      return false;
    }
  }, [chainType]);

  const runAuditPhase = useCallback(async (): Promise<boolean> => {
    setPhase('auditing');

    try {
      await waitForBoltShellReady();

      const command = getAuditCommand(chainType);
      const execution = await workbenchStore.boltTerminal.executeCommand(
        `audit-${Date.now()}`,
        command
      );

      if (!execution) {
        throw new Error('Audit execution failed');
      }

      const results = parseAuditResults(execution.output || '', chainType);

      recordAuditAttempt(results);

      return results.ok;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audit failed';
      const failedResults: ReturnType<typeof parseAuditResults> = {
        chainType,
        runner: chainType === 'evm' ? 'slither' : 'solana-security',
        command: getAuditCommand(chainType),
        ok: false,
        findings: [{
          id: 'audit-exec-error',
          title: 'Audit Execution Error',
          severity: 'high',
          description: message,
          location: { file: '' },
        }],
        summary: { critical: 0, high: 1, medium: 0, low: 0, informational: 0 },
        rawOutput: message,
      };
      recordAuditAttempt(failedResults);
      return false;
    }
  }, [chainType]);

  const attemptRepair = useCallback(async (phase: 'build' | 'test' | 'audit'): Promise<boolean> => {
    startRepairing(phase);

    const failures: RepairContext['failures'] = [];

    if (phase === 'build') {
      failures.push({
        name: 'Build Error',
        details: state.lastError || undefined,
      });
    } else if (phase === 'test') {
      const failedTests = getFailedTestsForRepair();
      for (const test of failedTests) {
        failures.push({
          name: test.name,
          details: test.details,
        });
      }
    } else if (phase === 'audit') {
      const auditFindings = getCriticalAuditFindingsForRepair();
      for (const finding of auditFindings) {
        failures.push({
          name: finding.title,
          details: finding.description,
          location: finding.location.file 
            ? `${finding.location.file}${finding.location.line ? `:${finding.location.line}` : ''}`
            : undefined,
        });
      }
    }

    if (failures.length === 0) {
      return false;
    }

    await sendRepairRequest({
      phase,
      failures,
      chainType,
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    return true;
  }, [state.lastError, chainType, sendRepairRequest]);

  const runWorkflow = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    startWorkflow(chainType);

    try {
      // Phase 1: Build
      let buildSuccess = false;
      let buildAttempts = 0;

      while (!buildSuccess && buildAttempts < 3 && !signal.aborted) {
        buildSuccess = await runBuildPhase();
        if (!buildSuccess && canRetry('build')) {
          await attemptRepair('build');
          buildAttempts++;
        }
      }

      if (!buildSuccess) {
        setPhase('failed');
        return;
      }

      // Phase 2: Test
      let testSuccess = false;
      let testAttempts = 0;

      while (!testSuccess && testAttempts < 3 && !signal.aborted) {
        testSuccess = await runTestPhase();
        if (!testSuccess && canRetry('test')) {
          await attemptRepair('test');
          testAttempts++;
        }
      }

      if (!testSuccess) {
        setPhase('failed');
        return;
      }

      // Phase 3: Audit
      let auditSuccess = false;
      let auditAttempts = 0;

      while (!auditSuccess && auditAttempts < 3 && !signal.aborted) {
        auditSuccess = await runAuditPhase();
        if (!auditSuccess && canRetry('audit')) {
          await attemptRepair('audit');
          auditAttempts++;
        }
      }

      if (!auditSuccess) {
        setPhase('failed');
        return;
      }

      setPhase('ready');
    } catch (error) {
      logger.error('Workflow error:', error);
      setPhase('failed');
    }
  }, [chainType, runBuildPhase, runTestPhase, runAuditPhase, attemptRepair]);

  const stopWorkflow = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhase('failed');
  }, []);

  return {
    runWorkflow,
    stopWorkflow,
    runBuildPhase,
    runTestPhase,
    runAuditPhase,
    attemptRepair,
    state,
  };
}
