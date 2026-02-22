import test from "node:test";
import assert from "node:assert/strict";
import { runStressTest } from "../src/stress-harness.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("runs 60 tasks and tracks concurrency", async () => {
  let active = 0;
  let maxActive = 0;
  const report = await runStressTest({
    taskCount: 60,
    maxConcurrency: 50,
    executeTask: async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await sleep(20);
      active -= 1;
    },
  });
  assert.equal(report.ok, true);
  assert.equal(report.succeeded, 60);
  assert.equal(report.failed, 0);
  assert.ok(report.peakConcurrency >= 20);
  assert.ok(maxActive >= 20);
});

test("captures first failure bucket around early-task breakage", async () => {
  const report = await runStressTest({
    taskCount: 55,
    maxConcurrency: 50,
    failureBucketSize: 5,
    executeTask: async (taskId) => {
      if (taskId >= 7 && taskId % 5 === 0) {
        throw new Error("synthetic-failure");
      }
    },
  });
  assert.equal(report.ok, false);
  assert.equal(report.firstFailureTaskId, 10);
  assert.equal(report.firstFailureBucketStart, 6);
  assert.ok(report.failed >= 1);
});

test("marks timeout failures when task exceeds configured timeout", async () => {
  const report = await runStressTest({
    taskCount: 50,
    maxConcurrency: 25,
    taskTimeoutMs: 10,
    executeTask: async (taskId) => {
      if (taskId === 3) {
        await sleep(30);
      }
    },
  });
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((item) => item.reason.includes("timed out")));
});

test("rejects under-sized stress runs", async () => {
  await assert.rejects(
    () => runStressTest({ taskCount: 49, maxConcurrency: 49 }),
    /at least 50/,
  );
});
