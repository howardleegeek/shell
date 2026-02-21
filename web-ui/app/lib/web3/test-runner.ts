import type { ChainType } from '~/lib/stores/chain';

export interface ParsedTestCase {
  name: string;
  status: 'pass' | 'fail';
  duration?: string;
  details?: string;
}

export interface ParsedTestResults {
  chainType: ChainType;
  command: string;
  passed: number;
  failed: number;
  total: number;
  duration?: string;
  tests: ParsedTestCase[];
  rawOutput: string;
}

interface IntermediateParse {
  tests: ParsedTestCase[];
  passed?: number;
  failed?: number;
  duration?: string;
}

const EVM_TEST_COMMAND = 'forge test --json';
const SVM_TEST_COMMAND = 'anchor test';

export function getTestCommand(chainType: ChainType): string {
  return chainType === 'evm' ? EVM_TEST_COMMAND : SVM_TEST_COMMAND;
}

export function parseTestResults(output: string, chainType: ChainType): ParsedTestResults {
  const rawOutput = (output || '').replace(/\r\n/g, '\n');
  const parsed = chainType === 'evm' ? parseEvmResults(rawOutput) : parseSvmResults(rawOutput);
  const fallbackSummary = extractSummaryCounts(rawOutput);

  const derivedPassed = parsed.tests.filter((test) => test.status === 'pass').length;
  const derivedFailed = parsed.tests.filter((test) => test.status === 'fail').length;

  const passed = parsed.passed ?? fallbackSummary.passed ?? derivedPassed;
  const failed = parsed.failed ?? fallbackSummary.failed ?? derivedFailed;

  return {
    chainType,
    command: getTestCommand(chainType),
    passed,
    failed,
    total: Math.max(passed + failed, parsed.tests.length),
    duration: parsed.duration ?? fallbackSummary.duration,
    tests: parsed.tests,
    rawOutput,
  };
}

function parseEvmResults(output: string): IntermediateParse {
  const tests: ParsedTestCase[] = [];

  const jsonCandidates = extractJsonCandidates(output);
  const seen = new Set<string>();

  for (const candidate of jsonCandidates) {
    collectTestsFromUnknown(candidate, tests, seen);
  }

  const bracketTests = parseBracketStyleTests(output);
  const combined = dedupeTests([...tests, ...bracketTests]);

  const summary = extractSummaryCounts(output);

  return {
    tests: combined,
    passed: summary.passed,
    failed: summary.failed,
    duration: summary.duration,
  };
}

function parseSvmResults(output: string): IntermediateParse {
  const tests: ParsedTestCase[] = [];

  const rustLikeRegex = /^\s*(?:test\s+)?(.+?)\s+\.\.\.\s+(ok|FAILED)(?:\s+\(([^)]+)\))?\s*$/gim;

  for (const match of output.matchAll(rustLikeRegex)) {
    const [, rawName, rawStatus, rawDuration] = match;
    const name = normalizeTestName(rawName);

    if (!name) {
      continue;
    }

    tests.push({
      name,
      status: rawStatus.toLowerCase() === 'ok' ? 'pass' : 'fail',
      duration: normalizeDuration(rawDuration),
    });
  }

  const passCheckRegex = /^\s*(?:✓|✔)\s+(.+?)(?:\s+\(([^)]+)\))?\s*$/gm;

  for (const match of output.matchAll(passCheckRegex)) {
    const [, rawName, rawDuration] = match;
    const name = normalizeTestName(rawName);

    if (!name) {
      continue;
    }

    tests.push({
      name,
      status: 'pass',
      duration: normalizeDuration(rawDuration),
    });
  }

  const failCheckRegex = /^\s*(?:✗|✘|×)\s+(.+?)(?:\s+\(([^)]+)\))?\s*$/gm;

  for (const match of output.matchAll(failCheckRegex)) {
    const [, rawName, rawDuration] = match;
    const name = normalizeTestName(rawName);

    if (!name) {
      continue;
    }

    tests.push({
      name,
      status: 'fail',
      duration: normalizeDuration(rawDuration),
    });
  }

  const summary = extractSummaryCounts(output);

  return {
    tests: dedupeTests(tests),
    passed: summary.passed,
    failed: summary.failed,
    duration: summary.duration,
  };
}

function extractJsonCandidates(output: string): unknown[] {
  const candidates: unknown[] = [];
  const trimmed = output.trim();

  if (!trimmed) {
    return candidates;
  }

  try {
    candidates.push(JSON.parse(trimmed));
  } catch {
    // noop
  }

  for (const line of output.split('\n')) {
    const value = line.trim();

    if (!(value.startsWith('{') || value.startsWith('['))) {
      continue;
    }

    try {
      candidates.push(JSON.parse(value));
    } catch {
      // noop
    }
  }

  return candidates;
}

function collectTestsFromUnknown(value: unknown, tests: ParsedTestCase[], seen: Set<string>) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTestsFromUnknown(item, tests, seen);
    }

    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;
  const name = normalizeTestName(
    coerceString(record.test) ||
      coerceString(record.name) ||
      coerceString(record.signature) ||
      coerceString(record.title) ||
      coerceString(record.function),
  );

  const status = extractStatus(record);

  if (name && status) {
    const duration = normalizeDuration(
      coerceString(record.duration) ||
        coerceString(record.duration_ms) ||
        coerceString(record.durationMs) ||
        coerceString(record.time) ||
        coerceString(record.elapsed),
    );
    const details =
      coerceString(record.error) ||
      coerceString(record.reason) ||
      coerceString(record.message) ||
      coerceString(record.details);

    const identity = `${status}:${name}`;

    if (!seen.has(identity)) {
      tests.push({ name, status, duration, details });
      seen.add(identity);
    }
  }

  for (const child of Object.values(record)) {
    collectTestsFromUnknown(child, tests, seen);
  }
}

function parseBracketStyleTests(output: string): ParsedTestCase[] {
  const tests: ParsedTestCase[] = [];
  const regex = /^\s*\[([^\]]+)\]\s+(.+?)(?:\s+\(([^)]+)\))?\s*$/gim;

  for (const match of output.matchAll(regex)) {
    const [, bracket, rawName, rawDuration] = match;
    const status = toStatus(bracket);

    if (!status) {
      continue;
    }

    const name = normalizeTestName(rawName);

    if (!name) {
      continue;
    }

    let details: string | undefined;

    if (status === 'fail') {
      const reason = bracket
        .replace(/fail/i, '')
        .replace(/^[\s.:;-]+/, '')
        .trim();

      details = reason || undefined;
    }

    tests.push({
      name,
      status,
      duration: normalizeDuration(rawDuration),
      details,
    });
  }

  return tests;
}

function extractSummaryCounts(output: string): { passed?: number; failed?: number; duration?: string } {
  const rustSummary = output.match(
    /test result:\s*(?:ok|FAILED)\.\s*(\d+)\s+passed;\s*(\d+)\s+failed;[^\n]*?(?:finished in\s*([\w.]+))?/i,
  );

  if (rustSummary) {
    return {
      passed: parseInt(rustSummary[1], 10),
      failed: parseInt(rustSummary[2], 10),
      duration: normalizeDuration(rustSummary[3]),
    };
  }

  const passingMatch = output.match(/\b(\d+)\s+passing\b/i);
  const failingMatch = output.match(/\b(\d+)\s+failing\b/i);

  if (passingMatch || failingMatch) {
    return {
      passed: passingMatch ? parseInt(passingMatch[1], 10) : 0,
      failed: failingMatch ? parseInt(failingMatch[1], 10) : 0,
      duration: normalizeDuration(output.match(/\(([^)]+)\)$/m)?.[1]),
    };
  }

  const passedMatch = output.match(/\b(\d+)\s+passed\b/i);
  const failedMatch = output.match(/\b(\d+)\s+failed\b/i);
  const durationMatch = output.match(/finished in\s*([\w.]+)/i);

  return {
    passed: passedMatch ? parseInt(passedMatch[1], 10) : undefined,
    failed: failedMatch ? parseInt(failedMatch[1], 10) : undefined,
    duration: normalizeDuration(durationMatch?.[1]),
  };
}

function extractStatus(record: Record<string, unknown>): ParsedTestCase['status'] | undefined {
  if (typeof record.failed === 'boolean') {
    return record.failed ? 'fail' : 'pass';
  }

  if (typeof record.passed === 'boolean') {
    return record.passed ? 'pass' : 'fail';
  }

  if (typeof record.success === 'boolean') {
    return record.success ? 'pass' : 'fail';
  }

  const candidates = [record.status, record.outcome, record.result, record.state, record.verdict];

  for (const candidate of candidates) {
    const status = toStatus(candidate);

    if (status) {
      return status;
    }
  }

  return undefined;
}

function toStatus(value: unknown): ParsedTestCase['status'] | undefined {
  if (typeof value === 'boolean') {
    return value ? 'pass' : 'fail';
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toLowerCase();

  if (/\b(pass|ok|success|succeeded)\b/.test(normalized)) {
    return 'pass';
  }

  if (/\b(fail|failed|error|revert|panic)\b/.test(normalized)) {
    return 'fail';
  }

  return undefined;
}

function dedupeTests(tests: ParsedTestCase[]): ParsedTestCase[] {
  const byIdentity = new Map<string, ParsedTestCase>();

  for (const test of tests) {
    const identity = `${test.status}:${test.name}`;
    const existing = byIdentity.get(identity);

    if (!existing) {
      byIdentity.set(identity, test);
      continue;
    }

    byIdentity.set(identity, {
      ...existing,
      duration: existing.duration || test.duration,
      details: existing.details || test.details,
    });
  }

  return Array.from(byIdentity.values());
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function normalizeTestName(value?: string): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/^test\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDuration(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.trim() || undefined;
}
