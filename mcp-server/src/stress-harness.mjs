const DEFAULT_TIMEOUT_MS = 2_000;
const DEFAULT_BUCKET_SIZE = 5;

function parseNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function withTimeout(promise, timeoutMs, taskId) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Task ${taskId} timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

function getTaskId(state, taskCount) {
  state.nextTaskId += 1;
  return state.nextTaskId <= taskCount ? state.nextTaskId : null;
}

async function runWorker(config, state) {
  while (true) {
    const taskId = getTaskId(state, config.taskCount);
    if (taskId === null) {
      return;
    }
    state.inFlight += 1;
    state.peakConcurrency = Math.max(state.peakConcurrency, state.inFlight);
    const startedAt = Date.now();
    try {
      await withTimeout(config.executeTask(taskId), config.taskTimeoutMs, taskId);
      state.successes.push({ taskId, durationMs: Date.now() - startedAt });
    } catch (error) {
      state.failures.push({
        taskId,
        durationMs: Date.now() - startedAt,
        reason: error instanceof Error ? error.message : String(error),
      });
    } finally {
      state.inFlight -= 1;
    }
  }
}

function summarizeFailures(failures, bucketSize) {
  if (failures.length === 0) {
    return { firstFailureTaskId: null, firstFailureBucketStart: null };
  }
  const first = failures.reduce((acc, item) => (item.taskId < acc ? item.taskId : acc), Number.POSITIVE_INFINITY);
  const bucketStart = Math.floor((first - 1) / bucketSize) * bucketSize + 1;
  return { firstFailureTaskId: first, firstFailureBucketStart: bucketStart };
}

export async function runStressTest(options = {}) {
  const taskCount = parseNumber(options.taskCount, 50);
  const maxConcurrency = parseNumber(options.maxConcurrency, 50);
  const taskTimeoutMs = parseNumber(options.taskTimeoutMs, DEFAULT_TIMEOUT_MS);
  const bucketSize = parseNumber(options.failureBucketSize, DEFAULT_BUCKET_SIZE);
  if (taskCount < 50) {
    throw new Error("taskCount must be at least 50 for stress validation");
  }
  const executeTask = options.executeTask ?? (async () => undefined);
  const state = { nextTaskId: 0, inFlight: 0, peakConcurrency: 0, successes: [], failures: [] };
  const workers = Array.from({ length: Math.min(taskCount, maxConcurrency) }, () => runWorker({ taskCount, taskTimeoutMs, executeTask }, state));
  const startedAt = Date.now();
  await Promise.all(workers);
  const finishedAt = Date.now();
  const failureSummary = summarizeFailures(state.failures, bucketSize);
  return {
    ok: state.failures.length === 0,
    taskCount,
    maxConcurrency,
    peakConcurrency: state.peakConcurrency,
    succeeded: state.successes.length,
    failed: state.failures.length,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    durationMs: finishedAt - startedAt,
    ...failureSummary,
    failures: state.failures,
  };
}
