import { runStressTest } from "./stress-harness.mjs";

function readArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }
  const value = Number.parseInt(process.argv[index + 1], 10);
  return Number.isFinite(value) ? value : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeSyntheticTask(taskId, failAfter, failEvery) {
  await sleep(15 + (taskId % 7) * 3);
  if (taskId >= failAfter && (taskId - failAfter) % failEvery === 0) {
    throw new Error(`Injected failure at task ${taskId}`);
  }
}

async function main() {
  const taskCount = readArg("--tasks", 60);
  const maxConcurrency = readArg("--concurrency", 50);
  const failAfter = readArg("--fail-after", 999_999);
  const failEvery = readArg("--fail-every", 2);
  const taskTimeoutMs = readArg("--timeout-ms", 1_500);
  const report = await runStressTest({
    taskCount,
    maxConcurrency,
    taskTimeoutMs,
    executeTask: (taskId) => executeSyntheticTask(taskId, failAfter, Math.max(failEvery, 1)),
  });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, task_id: "stress-cli", error: message }));
  process.exit(1);
});
