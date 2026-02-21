import { atom, computed } from 'nanostores';
import type { ChainType } from '~/lib/stores/chain';
import type { ParsedTestResults, ParsedTestCase } from '~/lib/web3/test-runner';
import type { AuditFinding, ParsedAuditResults } from '~/lib/web3/audit-parser';

export type RepairPhase = 'idle' | 'building' | 'build_ok' | 'build_fail' | 'repairing_build' |
  'testing' | 'test_ok' | 'test_fail' | 'repairing_test' |
  'auditing' | 'audit_ok' | 'audit_fail' | 'repairing_audit' |
  'ready' | 'failed';

export interface RepairAttempt {
  phase: 'build' | 'test' | 'audit';
  attemptNumber: number;
  timestamp: number;
  error?: string;
  fixed?: boolean;
}

export interface AutoRepairState {
  phase: RepairPhase;
  chainType: ChainType;
  buildAttempts: number;
  testAttempts: number;
  auditAttempts: number;
  maxAttempts: number;
  lastError: string | null;
  testResults: ParsedTestResults | null;
  auditResults: ParsedAuditResults | null;
  failedTests: ParsedTestCase[];
  criticalAuditFindings: AuditFinding[];
  repairHistory: RepairAttempt[];
  startedAt: number | null;
  completedAt: number | null;
}

const initialState: AutoRepairState = {
  phase: 'idle',
  chainType: 'svm',
  buildAttempts: 0,
  testAttempts: 0,
  auditAttempts: 0,
  maxAttempts: 3,
  lastError: null,
  testResults: null,
  auditResults: null,
  failedTests: [],
  criticalAuditFindings: [],
  repairHistory: [],
  startedAt: null,
  completedAt: null,
};

export const autoRepairStore = atom<AutoRepairState>(initialState);

export const isRepairing = computed(
  [autoRepairStore],
  (state) => state.phase.includes('repairing')
);

export const canProceed = computed(
  [autoRepairStore],
  (state) => {
    if (state.phase === 'idle') return true;
    if (state.phase === 'ready') return true;
    if (state.phase === 'failed') return true;
    return false;
  }
);

export const workflowProgress = computed(
  [autoRepairStore],
  (state) => {
    const phases = ['building', 'testing', 'auditing'];
    const currentPhaseIndex = phases.findIndex(p => 
      state.phase.includes(p) || state.phase.includes(p.replace('ing', '_'))
    );
    
    const phaseProgress = {
      build: state.buildAttempts > 0 || 
        ['build_ok', 'build_fail', 'repairing_build', 'testing', 'test_ok', 'test_fail', 'repairing_test', 'auditing', 'audit_ok', 'audit_fail', 'repairing_audit', 'ready'].includes(state.phase),
      test: state.testAttempts > 0 || 
        ['test_ok', 'test_fail', 'repairing_test', 'auditing', 'audit_ok', 'audit_fail', 'repairing_audit', 'ready'].includes(state.phase),
      audit: state.auditAttempts > 0 || 
        ['audit_ok', 'audit_fail', 'repairing_audit', 'ready'].includes(state.phase),
    };

    const phaseStatus = {
      build: state.phase === 'building' || state.phase === 'repairing_build' ? 'running' :
             state.phase === 'build_ok' ? 'passed' :
             state.phase === 'build_fail' ? 'failed' :
             phaseProgress.build ? 'passed' : 'pending',
      test: state.phase === 'testing' || state.phase === 'repairing_test' ? 'running' :
            state.phase === 'test_ok' ? 'passed' :
            state.phase === 'test_fail' ? 'failed' :
            phaseProgress.test ? 'passed' : 'pending',
      audit: state.phase === 'auditing' || state.phase === 'repairing_audit' ? 'running' :
             state.phase === 'audit_ok' ? 'passed' :
             state.phase === 'audit_fail' ? 'failed' :
             phaseProgress.audit ? 'passed' : 'pending',
    };

    return {
      currentPhase: currentPhaseIndex >= 0 ? phases[currentPhaseIndex] : null,
      phaseProgress,
      phaseStatus,
      overallProgress: state.phase === 'ready' ? 100 : 
                       state.phase === 'failed' ? 0 :
                       currentPhaseIndex >= 0 ? ((currentPhaseIndex + 1) / phases.length) * 100 : 0,
    };
  }
);

export function startWorkflow(chainType: ChainType) {
  autoRepairStore.set({
    ...initialState,
    phase: 'building',
    chainType,
    startedAt: Date.now(),
  });
}

export function setPhase(phase: RepairPhase) {
  const state = autoRepairStore.get();
  autoRepairStore.set({
    ...state,
    phase,
    completedAt: phase === 'ready' || phase === 'failed' ? Date.now() : null,
  });
}

export function recordBuildAttempt(success: boolean, error?: string) {
  const state = autoRepairStore.get();
  const attempt: RepairAttempt = {
    phase: 'build',
    attemptNumber: state.buildAttempts + 1,
    timestamp: Date.now(),
    error: success ? undefined : error,
    fixed: success,
  };

  autoRepairStore.set({
    ...state,
    buildAttempts: state.buildAttempts + 1,
    phase: success ? 'build_ok' : 'build_fail',
    lastError: success ? null : error || null,
    repairHistory: [...state.repairHistory, attempt],
  });
}

export function recordTestAttempt(results: ParsedTestResults) {
  const state = autoRepairStore.get();
  const failedTests = results.tests.filter(t => t.status === 'fail');
  const success = failedTests.length === 0;
  
  const attempt: RepairAttempt = {
    phase: 'test',
    attemptNumber: state.testAttempts + 1,
    timestamp: Date.now(),
    error: success ? undefined : `${failedTests.length} test(s) failed`,
    fixed: success,
  };

  autoRepairStore.set({
    ...state,
    testAttempts: state.testAttempts + 1,
    phase: success ? 'test_ok' : 'test_fail',
    testResults: results,
    failedTests,
    lastError: success ? null : `${failedTests.length} test(s) failed`,
    repairHistory: [...state.repairHistory, attempt],
  });
}

export function recordAuditAttempt(results: ParsedAuditResults) {
  const state = autoRepairStore.get();
  const criticalFindings = results.findings.filter(
    f => f.severity === 'critical' || f.severity === 'high'
  );
  const success = criticalFindings.length === 0;

  const attempt: RepairAttempt = {
    phase: 'audit',
    attemptNumber: state.auditAttempts + 1,
    timestamp: Date.now(),
    error: success ? undefined : `${criticalFindings.length} critical/high finding(s)`,
    fixed: success,
  };

  autoRepairStore.set({
    ...state,
    auditAttempts: state.auditAttempts + 1,
    phase: success ? 'audit_ok' : 'audit_fail',
    auditResults: results,
    criticalAuditFindings: criticalFindings,
    lastError: success ? null : `${criticalFindings.length} critical/high finding(s)`,
    repairHistory: [...state.repairHistory, attempt],
  });
}

export function startRepairing(phase: 'build' | 'test' | 'audit') {
  const state = autoRepairStore.get();
  autoRepairStore.set({
    ...state,
    phase: `repairing_${phase}` as RepairPhase,
  });
}

export function canRetry(phase: 'build' | 'test' | 'audit'): boolean {
  const state = autoRepairStore.get();
  const attempts = phase === 'build' ? state.buildAttempts :
                   phase === 'test' ? state.testAttempts :
                   state.auditAttempts;
  return attempts < state.maxAttempts;
}

export function resetWorkflow() {
  autoRepairStore.set(initialState);
}

export function getFailedTestsForRepair(): ParsedTestCase[] {
  return autoRepairStore.get().failedTests;
}

export function getCriticalAuditFindingsForRepair(): AuditFinding[] {
  return autoRepairStore.get().criticalAuditFindings;
}
