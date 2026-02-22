import { useStore } from '@nanostores/react';
import { memo, useCallback, useEffect } from 'react';
import { autoRepairStore, workflowProgress, isRepairing, resetWorkflow } from '~/lib/stores/auto-repair';
import { chainStore } from '~/lib/stores/chain';
import { classNames } from '~/utils/classNames';
import { useAutoRepairWorkflow } from '~/lib/hooks/useAutoRepairWorkflow';

const PHASE_LABELS = {
  idle: 'Ready',
  building: 'Building...',
  build_ok: 'Build Passed',
  build_fail: 'Build Failed',
  repairing_build: 'Repairing Build...',
  testing: 'Running Tests...',
  test_ok: 'Tests Passed',
  test_fail: 'Tests Failed',
  repairing_test: 'Repairing Tests...',
  auditing: 'Auditing...',
  audit_ok: 'Audit Passed',
  audit_fail: 'Audit Failed',
  repairing_audit: 'Repairing Audit Issues...',
  ready: 'Ready to Deploy',
  failed: 'Workflow Failed',
};

const PHASE_ICONS = {
  idle: 'i-ph:circle-dashed',
  building: 'i-ph:spinner-gap animate-spin',
  build_ok: 'i-ph:check-circle text-green-500',
  build_fail: 'i-ph:x-circle text-red-500',
  repairing_build: 'i-ph:wrench animate-pulse',
  testing: 'i-ph:spinner-gap animate-spin',
  test_ok: 'i-ph:check-circle text-green-500',
  test_fail: 'i-ph:x-circle text-red-500',
  repairing_test: 'i-ph:wrench animate-pulse',
  auditing: 'i-ph:spinner-gap animate-spin',
  audit_ok: 'i-ph:check-circle text-green-500',
  audit_fail: 'i-ph:x-circle text-red-500',
  repairing_audit: 'i-ph:wrench animate-pulse',
  ready: 'i-ph:rocket-launch text-accent-500',
  failed: 'i-ph:warning-octagon text-red-500',
};

export const AutoRepairPanel = memo(() => {
  const state = useStore(autoRepairStore);
  const progress = useStore(workflowProgress);
  const repairing = useStore(isRepairing);
  const chainState = useStore(chainStore);
  const { runWorkflow, stopWorkflow } = useAutoRepairWorkflow();

  const handleStart = useCallback(() => {
    runWorkflow();
  }, [runWorkflow]);

  const handleReset = useCallback(() => {
    stopWorkflow();
    resetWorkflow();
  }, [stopWorkflow]);

  useEffect(() => {
    if (state.phase === 'building') {
      runWorkflow();
    }
  }, [state.phase, runWorkflow]);

  const getPhaseStatusIcon = (phase: 'build' | 'test' | 'audit') => {
    const status = progress.phaseStatus[phase];
    switch (status) {
      case 'running':
        return <div className="i-ph:spinner-gap animate-spin text-accent-500" />;
      case 'passed':
        return <div className="i-ph:check-circle text-green-500" />;
      case 'failed':
        return <div className="i-ph:x-circle text-red-500" />;
      default:
        return <div className="i-ph:circle text-gray-400" />;
    }
  };

  const getPhaseColor = (phase: 'build' | 'test' | 'audit') => {
    const status = progress.phaseStatus[phase];
    switch (status) {
      case 'running':
        return 'border-accent-500 bg-accent-500/10';
      case 'passed':
        return 'border-green-500 bg-green-500/10';
      case 'failed':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-600 bg-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Auto-Repair Pipeline</h3>
        <div className="flex gap-2">
          {state.phase === 'idle' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              <div className="i-ph:play" />
              Start
            </button>
          )}
          {(state.phase !== 'idle' || state.lastError) && (
            <button
              onClick={handleReset}
              disabled={repairing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="i-ph:arrow-counter-clockwise" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { phase: 'build' as const, label: 'Build' },
          { phase: 'test' as const, label: 'Test' },
          { phase: 'audit' as const, label: 'Audit' },
        ].map(({ phase, label }, index) => (
          <div key={phase} className="flex items-center gap-2 flex-1">
            <div
              className={classNames(
                'flex items-center gap-2 px-3 py-2 rounded-md border transition-all',
                getPhaseColor(phase)
              )}
            >
              {getPhaseStatusIcon(phase)}
              <span className="text-xs font-medium text-bolt-elements-textPrimary">{label}</span>
            </div>
            {index < 2 && (
              <div
                className={classNames(
                  'w-6 h-0.5',
                  progress.phaseProgress[phase] ? 'bg-green-500' : 'bg-gray-600'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={PHASE_ICONS[state.phase]} />
          <span className="text-sm text-bolt-elements-textSecondary">{PHASE_LABELS[state.phase]}</span>
        </div>
        {state.phase !== 'idle' && state.phase !== 'ready' && state.phase !== 'failed' && (
          <span className="text-xs text-bolt-elements-textTertiary">
            {Math.round(progress.overallProgress)}%
          </span>
        )}
      </div>

      {state.lastError && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/30">
          <div className="i-ph:warning text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 font-medium">Error</p>
            <p className="text-xs text-red-300 break-all">{state.lastError}</p>
          </div>
        </div>
      )}

      {state.failedTests.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-bolt-elements-textSecondary">Failed Tests:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {state.failedTests.slice(0, 5).map((test, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="i-ph:x-circle text-red-500 shrink-0 mt-0.5" />
                <span className="text-bolt-elements-textTertiary truncate">{test.name}</span>
              </div>
            ))}
            {state.failedTests.length > 5 && (
              <p className="text-xs text-bolt-elements-textTertiary pl-6">
                +{state.failedTests.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {state.criticalAuditFindings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-bolt-elements-textSecondary">Critical Audit Findings:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {state.criticalAuditFindings.slice(0, 5).map((finding, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div
                  className={classNames(
                    'shrink-0 mt-0.5',
                    finding.severity === 'critical' ? 'i-ph:warning-octagon text-red-500' : 'i-ph:warning text-orange-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-bolt-elements-textTertiary truncate block">{finding.title}</span>
                  {finding.location.file && (
                    <span className="text-bolt-elements-textTertiary opacity-60 text-[10px] truncate block">
                      {finding.location.file}
                      {finding.location.line && `:${finding.location.line}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {state.criticalAuditFindings.length > 5 && (
              <p className="text-xs text-bolt-elements-textTertiary pl-6">
                +{state.criticalAuditFindings.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {(state.buildAttempts > 0 || state.testAttempts > 0 || state.auditAttempts > 0) && (
        <div className="flex items-center gap-3 text-xs text-bolt-elements-textTertiary border-t border-bolt-elements-borderColor pt-2 mt-1">
          {state.buildAttempts > 0 && <span>Build: {state.buildAttempts}/{state.maxAttempts}</span>}
          {state.testAttempts > 0 && <span>Test: {state.testAttempts}/{state.maxAttempts}</span>}
          {state.auditAttempts > 0 && <span>Audit: {state.auditAttempts}/{state.maxAttempts}</span>}
        </div>
      )}

      {state.phase === 'ready' && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/30">
          <div className="i-ph:check-circle text-green-500" />
          <span className="text-sm font-medium text-green-400">Ready to Deploy</span>
        </div>
      )}
    </div>
  );
});

AutoRepairPanel.displayName = 'AutoRepairPanel';
