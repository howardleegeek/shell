import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileMap } from '~/lib/stores/files';
import { localChainStore } from '~/lib/stores/chain';

interface DebuggerPanelProps {
  files?: FileMap;
  selectedFile?: string;
  onNavigateToSource?: (filePath: string, line: number) => void;
}

interface StructLog {
  depth?: number;
  gas?: number;
  gasCost?: number;
  memory?: string[];
  op?: string;
  pc?: number;
  stack?: string[];
  storage?: Record<string, string>;
}

interface DebugTrace {
  structLogs?: StructLog[];
}

interface TxDetails {
  from?: string;
  to?: string;
  value?: string;
  input?: string;
  blockNumber?: string;
}

interface StepSnapshot {
  index: number;
  op: string;
  pc: number;
  gas: number;
  gasCost: number;
  stack: string[];
  memory: string[];
  storage: Array<{ slot: string; value: string }>;
}

interface StepVars {
  locals: Array<{ name: string; value: string }>;
  storage: Array<{ name: string; value: string }>;
  msgSender: string;
  msgValue: string;
  blockNumber: string;
}

const EMPTY_STEP: StepSnapshot = {
  index: 0,
  op: '-',
  pc: 0,
  gas: 0,
  gasCost: 0,
  stack: [],
  memory: [],
  storage: [],
};

const KEYWORDS_BY_OPCODE: Record<string, string[]> = {
  SSTORE: ['=', 'storage', 'mapping', '['],
  SLOAD: ['storage', 'mapping', '['],
  CALL: ['call(', '.call(', 'transfer(', 'send('],
  DELEGATECALL: ['delegatecall('],
  STATICCALL: ['staticcall('],
  LOG1: ['emit '],
  LOG2: ['emit '],
  LOG3: ['emit '],
  LOG4: ['emit '],
  RETURN: ['return '],
  REVERT: ['require(', 'revert(', 'assert('],
  JUMPI: ['if ', 'for ', 'while '],
};

function normalizeHex(value: string | undefined): string {
  if (!value) {
    return '0x0';
  }

  return value.startsWith('0x') ? value : `0x${value}`;
}

function parseStorage(log: StructLog): Array<{ slot: string; value: string }> {
  if (!log.storage) {
    return [];
  }

  return Object.entries(log.storage)
    .slice(0, 20)
    .map(([slot, value]) => ({ slot: normalizeHex(slot), value: normalizeHex(value) }));
}

function getRpcUrl(runtimeUrl: string | null): string {
  return runtimeUrl || 'http://127.0.0.1:8545';
}

async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok || payload.error) {
    const details = payload.error?.message || `RPC ${method} failed`;
    throw new Error(details);
  }

  return payload.result as T;
}

export async function loadRemixDebugModule() {
  try {
    return await import('@remix-project/remix-debug');
  } catch {
    return null;
  }
}

function lineMatchesOpcode(lineText: string, opcode: string): boolean {
  const keywords = KEYWORDS_BY_OPCODE[opcode] || [];
  const normalized = lineText.trim().toLowerCase();

  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function fallbackLineFromTrace(opcode: string, pc: number, source: string): number {
  const lines = source.split('\n');

  for (let idx = 0; idx < lines.length; idx += 1) {
    if (lineMatchesOpcode(lines[idx], opcode)) {
      return idx + 1;
    }
  }

  if (lines.length === 0) {
    return 1;
  }

  return (pc % lines.length) + 1;
}

export function buildStepVars(step: StepSnapshot, tx: TxDetails | null): StepVars {
  const calldata = normalizeHex(tx?.input);
  const payload = calldata.slice(10);
  const words = payload.match(/.{1,64}/g) || [];

  const locals = words.slice(0, 6).map((word, index) => ({
    name: `arg${index}`,
    value: `0x${word}`,
  }));

  const storage = step.storage.slice(0, 6).map((slot, index) => ({
    name: `slot_${index}(${slot.slot})`,
    value: slot.value,
  }));

  return {
    locals,
    storage,
    msgSender: normalizeHex(tx?.from),
    msgValue: normalizeHex(tx?.value),
    blockNumber: normalizeHex(tx?.blockNumber),
  };
}

function isSolidityFile(path: string): boolean {
  return path.endsWith('.sol');
}

function getSourceFile(paths: string[], selectedFile: string | undefined): string | undefined {
  if (selectedFile && isSolidityFile(selectedFile)) {
    return selectedFile;
  }

  return paths.find(isSolidityFile);
}

const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ files, selectedFile, onNavigateToSource }) => {
  const chainRuntime = useStore(localChainStore);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<DebugTrace | null>(null);
  const [txDetails, setTxDetails] = useState<TxDetails | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [sourceLine, setSourceLine] = useState(1);
  const [remixLoaded, setRemixLoaded] = useState(false);

  const filePaths = useMemo(() => Object.keys(files || {}), [files]);
  const sourcePath = useMemo(() => getSourceFile(filePaths, selectedFile), [filePaths, selectedFile]);
  const source = useMemo(() => {
    if (!sourcePath || !files) {
      return '';
    }

    const candidate = files[sourcePath];

    if (!candidate || candidate.type !== 'file' || candidate.isBinary) {
      return '';
    }

    return candidate.content;
  }, [files, sourcePath]);

  const steps = useMemo(() => {
    const logs = trace?.structLogs || [];

    return logs.map((item, index) => ({
      index,
      op: item.op || '-',
      pc: item.pc || 0,
      gas: item.gas || 0,
      gasCost: item.gasCost || 0,
      stack: item.stack || [],
      memory: item.memory || [],
      storage: parseStorage(item),
    }));
  }, [trace]);

  const activeStep = steps[stepIndex] || EMPTY_STEP;
  const stepVars = useMemo(() => buildStepVars(activeStep, txDetails), [activeStep, txDetails]);

  const rpcUrl = useMemo(() => getRpcUrl(chainRuntime.rpcUrl), [chainRuntime.rpcUrl]);

  const syncSourceLocation = useCallback(
    async (nextStep: StepSnapshot) => {
      if (!source) {
        return;
      }

      let nextLine = fallbackLineFromTrace(nextStep.op, nextStep.pc, source);
      const remixModule = await loadRemixDebugModule();

      if (remixModule) {
        setRemixLoaded(true);

        // Generic integration point with remix-debug runtime, with graceful fallback.
        const resolver = (remixModule as any).resolveSourceLocation;

        if (typeof resolver === 'function') {
          const resolved = await resolver({ step: nextStep, trace, source }).catch(() => null);

          if (resolved?.line && Number.isFinite(resolved.line)) {
            nextLine = Math.max(1, resolved.line);
          }
        }
      }

      setSourceLine(nextLine);

      if (sourcePath && onNavigateToSource) {
        onNavigateToSource(sourcePath, nextLine);
      }
    },
    [onNavigateToSource, source, sourcePath, trace],
  );

  const updateStep = useCallback(
    (nextIndex: number) => {
      if (steps.length === 0) {
        return;
      }

      const clamped = Math.max(0, Math.min(nextIndex, steps.length - 1));
      const targetStep = steps[clamped];

      setStepIndex(clamped);
      syncSourceLocation(targetStep).catch(() => {
        // No-op; fallback mapping remains active.
      });
    },
    [steps, syncSourceLocation],
  );

  const stepToBreakpoint = useCallback(
    (direction: 1 | -1) => {
      if (breakpoints.size === 0 || !sourcePath) {
        updateStep(stepIndex + direction);
        return;
      }

      let index = stepIndex + direction;

      while (index >= 0 && index < steps.length) {
        const candidate = steps[index];
        const line = fallbackLineFromTrace(candidate.op, candidate.pc, source);

        if (breakpoints.has(line)) {
          updateStep(index);
          return;
        }

        index += direction;
      }

      updateStep(stepIndex + direction);
    },
    [breakpoints, sourcePath, updateStep, stepIndex, steps, source],
  );

  const loadTransaction = useCallback(async () => {
    if (!txHash.startsWith('0x') || txHash.length < 10) {
      setError('Enter a valid transaction hash');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [traceResult, txResult] = await Promise.all([
        rpcCall<DebugTrace>(rpcUrl, 'debug_traceTransaction', [txHash, {}]),
        rpcCall<TxDetails | null>(rpcUrl, 'eth_getTransactionByHash', [txHash]),
      ]);

      setTrace(traceResult);
      setTxDetails(txResult || null);
      setStepIndex(0);

      if ((traceResult.structLogs || []).length > 0) {
        const firstStep = {
          index: 0,
          op: traceResult.structLogs?.[0]?.op || '-',
          pc: traceResult.structLogs?.[0]?.pc || 0,
          gas: traceResult.structLogs?.[0]?.gas || 0,
          gasCost: traceResult.structLogs?.[0]?.gasCost || 0,
          stack: traceResult.structLogs?.[0]?.stack || [],
          memory: traceResult.structLogs?.[0]?.memory || [],
          storage: parseStorage(traceResult.structLogs?.[0] || {}),
        };
        await syncSourceLocation(firstStep);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load transaction trace';
      setError(message);
      setTrace(null);
      setTxDetails(null);
      setStepIndex(0);
    } finally {
      setLoading(false);
    }
  }, [rpcUrl, syncSourceLocation, txHash]);

  const toggleBreakpoint = (line: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);

      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }

      return next;
    });
  };

  const sourceLines = source ? source.split('\n') : [];

  return (
    <div className="h-full flex flex-col bg-bolt-elements-background-depth-1">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-bolt-elements-borderColor text-xs">
        <span className="font-medium">EVM Debugger</span>
        <span className="text-bolt-elements-textTertiary">RPC: {rpcUrl}</span>
        {chainRuntime.chainType !== 'evm' && <span className="text-yellow-500">Switch chain to EVM/Anvil</span>}
        <span className="ml-auto text-bolt-elements-textTertiary">remix-debug: {remixLoaded ? 'loaded' : 'fallback'}</span>
      </div>

      <div className="px-3 py-2 border-b border-bolt-elements-borderColor flex items-center gap-2">
        <input
          aria-label="tx-hash-input"
          value={txHash}
          onChange={(event) => setTxHash(event.target.value.trim())}
          placeholder="Tx hash (0x...)"
          className="flex-1 rounded-md bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor px-2 py-1 text-xs"
        />
        <button
          className="px-3 py-1 text-xs rounded-md bg-accent-500 text-white disabled:opacity-60"
          onClick={loadTransaction}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Tx'}
        </button>
      </div>

      <div className="px-3 py-2 border-b border-bolt-elements-borderColor flex items-center gap-1 text-xs">
        <button aria-label="to-start" className="px-2 py-1 rounded border border-bolt-elements-borderColor" onClick={() => updateStep(0)}>
          |&lt;
        </button>
        <button
          aria-label="step-backward"
          className="px-2 py-1 rounded border border-bolt-elements-borderColor"
          onClick={() => updateStep(stepIndex - 1)}
        >
          &lt;
        </button>
        <button
          aria-label="step-into"
          className="px-2 py-1 rounded border border-bolt-elements-borderColor"
          onClick={() => updateStep(stepIndex + 1)}
        >
          Step
        </button>
        <button
          aria-label="step-over"
          className="px-2 py-1 rounded border border-bolt-elements-borderColor"
          onClick={() => updateStep(stepIndex + 1)}
        >
          Over
        </button>
        <button
          aria-label="next-breakpoint"
          className="px-2 py-1 rounded border border-bolt-elements-borderColor"
          onClick={() => stepToBreakpoint(1)}
        >
          Run to BP
        </button>
        <button
          aria-label="previous-breakpoint"
          className="px-2 py-1 rounded border border-bolt-elements-borderColor"
          onClick={() => stepToBreakpoint(-1)}
        >
          Prev BP
        </button>
        <button
          aria-label="to-end"
          className="px-2 py-1 rounded border border-bolt-elements-borderColor"
          onClick={() => updateStep(steps.length - 1)}
        >
          &gt;|
        </button>
        <span className="ml-auto text-bolt-elements-textTertiary">
          step {stepIndex + 1}/{Math.max(steps.length, 1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-2 min-h-0 flex-1 text-xs overflow-hidden">
        <div className="rounded border border-bolt-elements-borderColor p-2 overflow-auto">
          <div className="font-medium">Execution</div>
          <div>Opcode: {activeStep.op}</div>
          <div>PC: {activeStep.pc}</div>
          <div>Gas: {activeStep.gas}</div>
          <div>Gas Cost: {activeStep.gasCost}</div>
          <div className="mt-2 font-medium">Call Data</div>
          <div className="break-all text-bolt-elements-textTertiary">{normalizeHex(txDetails?.input)}</div>
          <div className="mt-2 font-medium">Variables</div>
          <div>msg.sender: {stepVars.msgSender}</div>
          <div>msg.value: {stepVars.msgValue}</div>
          <div>block.number: {stepVars.blockNumber}</div>
          <div className="mt-1 font-medium">Locals</div>
          {stepVars.locals.length === 0 && <div className="text-bolt-elements-textTertiary">none</div>}
          {stepVars.locals.map((item) => (
            <div key={item.name} className="break-all">
              {item.name}: {item.value}
            </div>
          ))}
          <div className="mt-1 font-medium">Storage Vars</div>
          {stepVars.storage.length === 0 && <div className="text-bolt-elements-textTertiary">none</div>}
          {stepVars.storage.map((item) => (
            <div key={item.name} className="break-all">
              {item.name}: {item.value}
            </div>
          ))}
        </div>

        <div className="rounded border border-bolt-elements-borderColor p-2 overflow-auto">
          <div className="font-medium">Source Map ({sourcePath || 'no solidity file'})</div>
          {sourceLines.length === 0 && <div className="text-bolt-elements-textTertiary">No Solidity source found in workspace.</div>}
          {sourceLines.slice(0, 350).map((line, index) => {
            const lineNo = index + 1;
            const isActive = lineNo === sourceLine;
            const hasBreakpoint = breakpoints.has(lineNo);

            return (
              <div
                key={`${lineNo}-${line}`}
                className={`flex gap-2 ${isActive ? 'bg-accent-500/15' : ''}`}
                aria-label={isActive ? 'source-line-active' : undefined}
              >
                <button
                  aria-label={`line-${lineNo}`}
                  onClick={() => toggleBreakpoint(lineNo)}
                  className={`w-14 shrink-0 text-right pr-2 ${hasBreakpoint ? 'text-red-500' : 'text-bolt-elements-textTertiary'}`}
                >
                  {hasBreakpoint ? '●' : '○'} {lineNo}
                </button>
                <div className="font-mono whitespace-pre-wrap break-words flex-1">{line}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded border border-bolt-elements-borderColor p-2 overflow-auto">
          <div className="font-medium">Stack</div>
          {activeStep.stack.length === 0 && <div className="text-bolt-elements-textTertiary">empty</div>}
          {activeStep.stack.slice().reverse().slice(0, 64).map((value, index) => (
            <div key={`${value}-${index}`} className="break-all">
              {index}: {normalizeHex(value)}
            </div>
          ))}
        </div>

        <div className="rounded border border-bolt-elements-borderColor p-2 overflow-auto">
          <div className="font-medium">Memory</div>
          {activeStep.memory.length === 0 && <div className="text-bolt-elements-textTertiary">empty</div>}
          {activeStep.memory.slice(0, 64).map((value, index) => (
            <div key={`${value}-${index}`} className="break-all">
              {index}: {normalizeHex(value)}
            </div>
          ))}
          <div className="mt-2 font-medium">Storage</div>
          {activeStep.storage.length === 0 && <div className="text-bolt-elements-textTertiary">empty</div>}
          {activeStep.storage.map((item) => (
            <div key={item.slot} className="break-all">
              slot[{item.slot}] = {item.value}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="px-3 py-2 border-t border-bolt-elements-borderColor text-red-500 text-xs">{error}</div>}
    </div>
  );
};

export default DebuggerPanel;
