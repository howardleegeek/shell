import { useStore } from '@nanostores/react';
import { chainStore, type ChainType } from '~/lib/stores/chain';
import { completeBuildRun, failBuildRun, startBuildRun, buildRunStore } from '~/lib/stores/build-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('BuildButton');
const SHELL_READY_TIMEOUT_MS = 10_000;

function getBuildCommand(chainType: ChainType) {
  return chainType === 'evm' ? 'forge build' : 'anchor build';
}

function toRunner(chainType: ChainType) {
  return chainType === 'evm' ? 'forge' : 'anchor';
}

function toChain(chainType: ChainType) {
  return chainType === 'evm' ? 'evm' : 'solana';
}

async function waitForBoltShellReady() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      workbenchStore.boltTerminal.ready(),
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Terminal is still initializing. Please try again in a moment.')), SHELL_READY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function writeBuildReport(params: {
  ok: boolean;
  chainType: ChainType;
  command: string;
  exitCode: number;
  startedAt: string;
  finishedAt: string;
  output: string;
}) {
  const chain = toChain(params.chainType);
  const runner = toRunner(params.chainType);
  const wc = await webcontainer;
  const filename = `reports/build.${chain}.${runner}.json`;
  const report = {
    ok: params.ok,
    chain,
    runner,
    action: 'build',
    startedAt: params.startedAt,
    finishedAt: params.finishedAt,
    command: params.command,
    exitCode: params.exitCode,
    summary: params.ok ? 'Build successful' : 'Build failed',
    stdout: params.output,
    stderr: params.ok ? '' : params.output,
  };
  await wc.fs.mkdir('reports', { recursive: true });
  await wc.fs.writeFile(filename, JSON.stringify(report, null, 2));
}

export function BuildButton() {
  const chainState = useStore(chainStore);
  const buildRun = useStore(buildRunStore);
  const chainType: ChainType = chainState?.chainType ?? 'svm';
  const command = getBuildCommand(chainType);
  const isBuilding = buildRun.status === 'building';

  const runBuild = async () => {
    if (isBuilding) {
      return;
    }

    const startedAt = new Date().toISOString();
    startBuildRun(chainType, command);

    try {
      workbenchStore.setShowWorkbench(true);
      workbenchStore.toggleTerminal(true);
      await waitForBoltShellReady();

      const execution = await workbenchStore.boltTerminal.executeCommand(`build-run-${Date.now()}`, command);
      const output = execution?.output || '';
      const exitCode = execution?.exitCode ?? 1;
      const finishedAt = new Date().toISOString();
      const ok = exitCode === 0;

      await writeBuildReport({ ok, chainType, command, exitCode, startedAt, finishedAt, output });

      if (ok) {
        completeBuildRun(chainType, command);
        return;
      }

      failBuildRun(chainType, command, `${chainType.toUpperCase()} build exited with code ${exitCode}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run build';
      logger.error('Failed to run build:', error);
      failBuildRun(chainType, command, message);
    }
  };

  return (
    <button
      onClick={runBuild}
      disabled={isBuilding}
      className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs border border-[#5bc0ff]/70 bg-[#04101a] text-[#b6e4ff] hover:text-[#d9f2ff] [&:not(:disabled,.disabled)]:hover:bg-[#0a2134] [&:not(:disabled,.disabled)]:hover:shadow-[0_0_16px_rgba(91,192,255,0.45)] outline-[#5bc0ff] flex gap-1.5 transition-all duration-150"
      title={`Run ${chainType.toUpperCase()} build`}
      type="button"
    >
      <div className={isBuilding ? 'i-ph:spinner-gap animate-spin' : 'i-ph:hammer'} />
      <span>{isBuilding ? 'Building...' : 'Build'}</span>
    </button>
  );
}
