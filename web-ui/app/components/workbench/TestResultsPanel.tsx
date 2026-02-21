import { useStore } from '@nanostores/react';
import { testRunStore } from '~/lib/stores/test-runner';
import { classNames } from '~/utils/classNames';

export function TestResultsPanel() {
  const testRun = useStore(testRunStore);
  const hasPanelContent = testRun.isRunning || !!testRun.results || !!testRun.error;

  if (!hasPanelContent) {
    return null;
  }

  return (
    <div className="border-b border-[#39ff14]/35 bg-[#040d07]/80 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#b8ffc6] tracking-wide uppercase">
          <div className={testRun.isRunning ? 'i-ph:spinner-gap animate-spin' : 'i-ph:flask'} />
          <span>Test Results</span>
          <span className="rounded border border-[#39ff14]/40 px-1.5 py-0.5 text-[10px] text-[#8fe39e] bg-[#0a1a0f]">
            {testRun.chainType.toUpperCase()}
          </span>
        </div>
        <div className="text-[11px] text-[#6fb57c] font-mono">{testRun.command}</div>
      </div>

      {testRun.error && <div className="mt-2 text-xs text-red-400">{testRun.error}</div>}

      {testRun.results && (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <StatChip label="Passed" value={testRun.results.passed} tone="pass" />
            <StatChip label="Failed" value={testRun.results.failed} tone="fail" />
            <StatChip label="Total" value={testRun.results.total} tone="neutral" />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-[#77c086]">
            <span>
              {testRun.results.duration ? `Duration ${testRun.results.duration}` : 'Duration unavailable'}
            </span>
            <span>
              {testRun.lastRunAt
                ? `Last run ${new Date(testRun.lastRunAt).toLocaleTimeString()}`
                : 'No recent run'}
            </span>
          </div>

          <div className="mt-2 max-h-44 overflow-y-auto pr-1 space-y-1">
            {testRun.results.tests.length > 0 ? (
              testRun.results.tests.map((test, index) => (
                <details
                  key={`${test.name}-${index}`}
                  className={classNames('rounded border bg-[#07130c] px-2 py-1', {
                    'border-[#27c761]/45': test.status === 'pass',
                    'border-[#ff4d67]/45': test.status === 'fail',
                  })}
                >
                  <summary className="list-none flex items-center gap-2 text-xs cursor-pointer select-none">
                    <span
                      className={classNames('font-semibold', {
                        'text-[#6eff94]': test.status === 'pass',
                        'text-[#ff6f84]': test.status === 'fail',
                      })}
                    >
                      {test.status === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                    <span className="text-bolt-elements-textPrimary truncate flex-1">{test.name}</span>
                    {test.duration && <span className="text-bolt-elements-textTertiary">{test.duration}</span>}
                    <span className="i-ph:caret-down text-bolt-elements-textTertiary" />
                  </summary>
                  <div className="mt-1 text-[11px] text-bolt-elements-textSecondary whitespace-pre-wrap break-words">
                    {test.details || 'No additional details'}
                  </div>
                </details>
              ))
            ) : (
              <div className="text-xs text-bolt-elements-textTertiary rounded border border-[#39ff14]/20 bg-[#07130c] px-2 py-1.5">
                No individual tests detected in output. See terminal for raw logs.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: 'pass' | 'fail' | 'neutral' }) {
  return (
    <div
      className={classNames('rounded border px-2 py-1 text-xs flex items-center justify-between', {
        'border-[#27c761]/45 bg-[#082111] text-[#85ffab]': tone === 'pass',
        'border-[#ff4d67]/45 bg-[#24080f] text-[#ff9aaa]': tone === 'fail',
        'border-[#39ff14]/35 bg-[#0a1a0f] text-[#b5ffc3]': tone === 'neutral',
      })}
    >
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
