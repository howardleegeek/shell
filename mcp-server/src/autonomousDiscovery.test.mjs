import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AUTONOMOUS_DISCOVERY_RULES,
  runAutonomousDiscovery,
} from "./autonomousDiscovery.ts";

async function withTempDir(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "autodiscovery-"));
  try {
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test("defines concrete discovery rules for all known risks", () => {
  assert.equal(AUTONOMOUS_DISCOVERY_RULES.length, 3);

  const ruleIds = AUTONOMOUS_DISCOVERY_RULES.map((rule) => rule.id);
  assert.deepEqual(ruleIds, [
    "temporal-edge-cases",
    "metrics-pipeline",
    "queue-namespace-routing",
  ]);
});

test("scans relevant files and reports matched patterns", async () => {
  await withTempDir(async (dir) => {
    const workerFile = path.join(dir, "src/worker.ts");
    const metricsFile = path.join(dir, "src/metrics-db.ts");

    await fs.mkdir(path.dirname(workerFile), { recursive: true });
    await fs.writeFile(
      workerFile,
      "const taskQueue = 'jobs'; const namespace = process.env.NAMESPACE; const retry = 3;",
      "utf8",
    );
    await fs.writeFile(
      metricsFile,
      "metrics.counter('x'); db.connect(); insert into metrics values(1);",
      "utf8",
    );

    const report = await runAutonomousDiscovery(dir, 200);
    assert.ok(report.scannedFileCount >= 2);

    const queueFinding = report.findings.find(
      (item) => item.ruleId === "queue-namespace-routing" && item.file === "src/worker.ts",
    );
    assert.ok(queueFinding);
    assert.ok(queueFinding.matchedPatterns.includes("namespace"));

    const metricsFinding = report.findings.find(
      (item) => item.ruleId === "metrics-pipeline" && item.file === "src/metrics-db.ts",
    );
    assert.ok(metricsFinding);
    assert.ok(metricsFinding.matchedPatterns.length >= 2);
  });
});
