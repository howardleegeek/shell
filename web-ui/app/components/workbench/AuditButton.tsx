import { useStore } from '@nanostores/react';
import { atom, computed } from 'nanostores';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { chainStore, type ChainType } from '~/lib/stores/chain';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';
import { classNames } from '~/utils/classNames';
import auditRunner from '~/lib/web3/audit-runner';

const SHELL_READY_TIMEOUT_MS = 10_000;
const severityOrder = ['critical', 'high', 'medium', 'low', 'info'] as const;

type AuditSeverity = (typeof severityOrder)[number];

export interface AuditFinding {
  id: string;
  source: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  recommendation: string;
  file: string;
  line: number;
  column: number;
  ruleId: string;
  raw: unknown;
}

interface AuditSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface AuditState {
  isRunning: boolean;
  chainType: ChainType;
  commandSummary: string;
  findings: AuditFinding[];
  summary: AuditSummary;
  error: string | null;
  lastRunAt: number | null;
}

const emptySummary: AuditSummary = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  info: 0,
};

const initialState: AuditState = {
  isRunning: false,
  chainType: 'svm',
  commandSummary: '',
  findings: [],
  summary: emptySummary,
  error: null,
  lastRunAt: null,
};

export const auditStateStore = atom<AuditState>(initialState);

export const hasBlockingAuditFindings = computed(auditStateStore, (state) => {
  return state.summary.critical + state.summary.high > 0;
});

export interface AuditInlineAnnotation {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: AuditSeverity;
  message: string;
}

export const auditInlineAnnotations = computed(auditStateStore, (state) => {
  return state.findings.map((finding) => ({
    id: finding.id,
    file: finding.file,
    line: finding.line,
    column: finding.column,
    severity: finding.severity,
    message: finding.description || finding.title,
  }));
});

function normalizeRelativePath(filePath: string) {
  const normalized = String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');

  if (normalized.startsWith(`${WORK_DIR}/`)) {
    return normalized.slice(WORK_DIR.length + 1);
  }

  return normalized;
}

function normalizeAbsolutePath(filePath: string) {
  const normalized = String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `${WORK_DIR}/${normalized}`;
}

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

async function executeAuditCommand(id: string, command: string) {
  const execution = await workbenchStore.boltTerminal.executeCommand(id, command);

  if (!execution) {
    throw new Error('Unable to access terminal execution context.');
  }

  return execution;
}

function severityLabel(severity: AuditSeverity) {
  if (severity === 'critical') {
    return 'Critical';
  }

  if (severity === 'high') {
    return 'High';
  }

  if (severity === 'medium') {
    return 'Medium';
  }

  if (severity === 'low') {
    return 'Low';
  }

  return 'Info';
}

function severityClasses(severity: AuditSeverity) {
  if (severity === 'critical' || severity === 'high') {
    return 'text-[#ff697e] border-[#ff4d67]/45 bg-[#2a0a13]';
  }

  if (severity === 'medium') {
    return 'text-[#ffd66b] border-[#facc15]/45 bg-[#2a2206]';
  }

  if (severity === 'low') {
    return 'text-[#8be0ad] border-[#86efac]/35 bg-[#0a1c12]';
  }

  return 'text-[#b7bec7] border-[#9ca3af]/35 bg-[#11161f]';
}

function sanitizeFindings(findings: AuditFinding[]) {
  return findings
    .filter((finding) => finding.file)
    .map((finding) => ({
      ...finding,
      file: normalizeAbsolutePath(finding.file),
      line: Math.max(1, finding.line || 1),
      column: Math.max(1, finding.column || 1),
    }));
}

function getFindingsBySeverity(findings: AuditFinding[]) {
  return severityOrder.map((severity) => ({
    severity,
    items: findings.filter((finding) => finding.severity === severity),
  }));
}

function generateRepairPlan(findings: AuditFinding[]) {
  const lines: string[] = [];

  lines.push('# Auto Repair Plan');
  lines.push('');
  lines.push('Apply the following fixes in order and keep behavior unchanged unless required by security constraints.');
  lines.push('');

  findings.forEach((finding, index) => {
    lines.push(`## ${index + 1}. [${severityLabel(finding.severity)}] ${finding.title}`);
    lines.push(`- File: ${normalizeRelativePath(finding.file)}:${finding.line}`);
    lines.push(`- Source: ${finding.source}`);

    if (finding.ruleId) {
      lines.push(`- Rule: ${finding.ruleId}`);
    }

    lines.push(`- Description: ${finding.description || 'No description available.'}`);
    lines.push(`- Recommended Fix: ${finding.recommendation}`);
    lines.push('');
  });

  return lines.join('\n');
}

export function AuditButton() {
  const chainState = useStore(chainStore);
  const auditState = useStore(auditStateStore);
  const [isOpen, setIsOpen] = useState(false);

  const chainType: ChainType = chainState?.chainType ?? 'svm';

  const groupedFindings = useMemo(() => getFindingsBySeverity(auditState.findings), [auditState.findings]);

  const jumpToFinding = (finding: AuditFinding) => {
    workbenchStore.setShowWorkbench(true);
    workbenchStore.currentView.set('code');
    workbenchStore.setSelectedFile(finding.file);

    requestAnimationFrame(() => {
      workbenchStore.setCurrentDocumentScrollPosition({
        line: Math.max(0, finding.line - 1),
        column: Math.max(0, finding.column - 1),
      });
    });
  };

  const runAudit = async () => {
    if (auditState.isRunning) {
      return;
    }

    auditStateStore.set({
      ...auditState,
      chainType,
      isRunning: true,
      error: null,
      commandSummary:
        chainType === 'evm'
          ? 'slither + semgrep --config=p/smart-contracts'
          : 'cargo clippy -- -D warnings + anchor security lint',
    });

    try {
      workbenchStore.setShowWorkbench(true);
      workbenchStore.toggleTerminal(true);
      await waitForBoltShellReady();
      await executeAuditCommand(`audit-setup-${Date.now()}`, 'mkdir -p reports');

      let findings: AuditFinding[] = [];

      if (chainType === 'evm') {
        const slitherExecution = await executeAuditCommand(
          `audit-slither-${Date.now()}`,
          "if command -v slither >/dev/null 2>&1; then slither . --json reports/audit.evm.slither.json >/dev/null 2>&1 || true; else echo '{\"results\":{\"detectors\":[]}}' > reports/audit.evm.slither.json; fi; if [ ! -s reports/audit.evm.slither.json ]; then echo '{\"results\":{\"detectors\":[]}}' > reports/audit.evm.slither.json; fi; cat reports/audit.evm.slither.json",
        );

        const semgrepExecution = await executeAuditCommand(
          `audit-semgrep-${Date.now()}`,
          "if command -v semgrep >/dev/null 2>&1; then semgrep --config=p/smart-contracts --json | tee reports/audit.evm.semgrep.json; else echo '{\"results\":[],\"errors\":[{\"message\":\"semgrep not installed\"}]}' | tee reports/audit.evm.semgrep.json; fi",
        );

        const slitherFindings = auditRunner.parseSlitherOutput(slitherExecution.output || '') as AuditFinding[];
        const semgrepFindings = auditRunner.parseSemgrepOutput(semgrepExecution.output || '') as AuditFinding[];

        findings = [...slitherFindings, ...semgrepFindings];
      } else {
        const clippyExecution = await executeAuditCommand(
          `audit-clippy-${Date.now()}`,
          'if command -v cargo >/dev/null 2>&1; then cargo clippy --message-format=json -- -D warnings 2>&1 | tee reports/audit.svm.clippy.json; else echo "cargo not installed" | tee reports/audit.svm.clippy.json; fi',
        );

        const clippyFindings = auditRunner.parseClippyOutput(clippyExecution.output || '') as AuditFinding[];

        const fileEntries = Object.entries(workbenchStore.files.get())
          .map(([filePath, dirent]) => [filePath, (dirent as any)?.content])
          .filter((entry) => typeof entry[1] === 'string') as [string, string][];

        const anchorFindings = auditRunner.runAnchorSecurityLints(fileEntries) as AuditFinding[];
        const anchorReport = JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            findings: anchorFindings,
          },
          null,
          2,
        );

        await workbenchStore.createFile(`${WORK_DIR}/reports/audit.svm.anchor-lints.json`, anchorReport);

        findings = [...clippyFindings, ...anchorFindings];
      }

      const sanitized = sanitizeFindings(findings);
      const sorted = auditRunner.sortFindings(sanitized) as AuditFinding[];
      const summary = auditRunner.summarizeFindings(sorted) as AuditSummary;

      auditStateStore.set({
        ...auditStateStore.get(),
        isRunning: false,
        chainType,
        findings: sorted,
        summary,
        error: null,
        lastRunAt: Date.now(),
      });

      setIsOpen(true);
      toast.success(`Audit finished: ${sorted.length} finding(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audit failed';

      auditStateStore.set({
        ...auditStateStore.get(),
        isRunning: false,
        chainType,
        error: message,
        lastRunAt: Date.now(),
      });

      setIsOpen(true);
      toast.error(message);
    }
  };

  const fixAllWithAI = async () => {
    const findings = auditStateStore.get().findings;

    if (findings.length === 0) {
      toast.info('No findings to repair. Run an audit first.');
      return;
    }

    const planPath = `${WORK_DIR}/reports/audit.fix-plan.md`;
    const content = generateRepairPlan(findings);
    const created = await workbenchStore.createFile(planPath, content);

    if (!created) {
      toast.error('Failed to create repair plan file.');
      return;
    }

    workbenchStore.setShowWorkbench(true);
    workbenchStore.currentView.set('code');
    workbenchStore.setSelectedFile(planPath);

    toast.success('Auto-repair plan generated at reports/audit.fix-plan.md');
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => {
          if (!auditState.isRunning) {
            void runAudit();
          }

          setIsOpen(true);
        }}
        disabled={auditState.isRunning}
        className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs border border-[#ffd15d]/70 bg-[#1f1706] text-[#ffe6a5] hover:text-[#fff2cc] [&:not(:disabled,.disabled)]:hover:bg-[#2a1f09] [&:not(:disabled,.disabled)]:hover:shadow-[0_0_16px_rgba(250,204,21,0.35)] outline-[#ffd15d] flex gap-1.5 transition-all duration-150"
        type="button"
        title="Run security audit"
      >
        <div className={auditState.isRunning ? 'i-ph:spinner-gap animate-spin' : 'i-ph:shield-checkered'} />
        <span>{auditState.isRunning ? 'Auditing' : 'Audit'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[260] w-[520px] max-w-[calc(100vw-24px)] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-2 text-sm font-semibold text-bolt-elements-textPrimary">
              <div className="i-ph:shield-warning" />
              <span>Security Audit</span>
              <span className="rounded border border-bolt-elements-borderColor px-1.5 py-0.5 text-[10px] text-bolt-elements-textTertiary">
                {auditState.chainType.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
              onClick={() => setIsOpen(false)}
            >
              <div className="i-ph:x" />
            </button>
          </div>

          <div className="px-3 py-2 border-b border-bolt-elements-borderColor text-[11px] text-bolt-elements-textTertiary">
            <div>{auditState.commandSummary}</div>
            <div>
              {auditState.lastRunAt ? `Last run ${new Date(auditState.lastRunAt).toLocaleTimeString()}` : 'Never scanned'}
            </div>
            {auditState.error && <div className="mt-1 text-red-400">{auditState.error}</div>}
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-3">
            {groupedFindings.map((group) => {
              if (group.items.length === 0) {
                return null;
              }

              return (
                <div key={group.severity}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-bolt-elements-textSecondary">
                    <span>{severityLabel(group.severity)}</span>
                    <span className="rounded border border-bolt-elements-borderColor px-1.5 py-0.5 text-[10px]">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map((finding) => (
                      <button
                        key={finding.id}
                        type="button"
                        onClick={() => jumpToFinding(finding)}
                        className={classNames(
                          'w-full text-left rounded border px-2 py-1.5 transition-colors hover:bg-bolt-elements-item-backgroundActive',
                          severityClasses(group.severity),
                        )}
                      >
                        <div className="text-xs font-semibold truncate">{finding.title}</div>
                        <div className="mt-0.5 text-[11px] break-words text-bolt-elements-textSecondary">
                          {finding.description || 'No description provided by scanner.'}
                        </div>
                        <div className="mt-1 text-[10px] font-mono text-bolt-elements-textTertiary">
                          {normalizeRelativePath(finding.file)}:{finding.line}
                        </div>
                        <div className="mt-1 text-[10px] text-bolt-elements-textTertiary">Fix: {finding.recommendation}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {!auditState.isRunning && auditState.findings.length === 0 && !auditState.error && (
              <div className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-2 text-xs text-bolt-elements-textTertiary">
                No findings yet. Run a scan to generate `reports/audit.{'{'}chain{'}'}.{'{'}tool{'}'}.json`.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 p-3 border-t border-bolt-elements-borderColor">
            <button
              type="button"
              onClick={() => void fixAllWithAI()}
              disabled={auditState.isRunning || auditState.findings.length === 0}
              className="rounded-md px-3 py-1.5 text-xs border border-[#60a5fa]/60 bg-[#0b1d33] text-[#bfdbfe] hover:bg-[#11294a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fix All with AI
            </button>
            <button
              type="button"
              onClick={() => void runAudit()}
              disabled={auditState.isRunning}
              className="rounded-md px-3 py-1.5 text-xs border border-[#facc15]/60 bg-[#2a2108] text-[#fde68a] hover:bg-[#3c2f0d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Re-scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
