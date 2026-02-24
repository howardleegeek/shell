import test from "node:test";
import assert from "node:assert/strict";
import { buildAuditResult } from "./slither-audit-core.ts";

const sampleDetectors = [
  {
    check: "reentrancy-eth",
    impact: "High",
    description: "Reentrancy vulnerability in withdraw.",
    elements: [
      { type: "contract", name: "Vault" },
      { type: "function", name: "withdraw" },
      { source_mapping: { lines: [21, 22, 23] } },
    ],
  },
  {
    check: "timestamp",
    impact: "Medium",
    description: "Dangerous use of block.timestamp.",
    elements: [{ type: "contract", name: "Vault" }],
  },
];

test("maps reentrancy issue with recommendation and SWC link", () => {
  const report = buildAuditResult(sampleDetectors, "all", 0.321);

  assert.equal(report.total_issues, 2);
  assert.equal(report.high, 1);
  assert.equal(report.medium, 1);
  assert.equal(report.audit_time_seconds, 0.321);

  const reentrancy = report.issues.find((issue) => issue.title === "reentrancy-eth");
  assert.ok(reentrancy);
  assert.equal(reentrancy.severity, "high");
  assert.equal(reentrancy.contract, "Vault");
  assert.equal(reentrancy.function, "withdraw");
  assert.deepEqual(reentrancy.lines, [21, 22, 23]);
  assert.ok(reentrancy.recommendation.length > 0);
  assert.equal(reentrancy.reference_url, "https://swcregistry.io/docs/SWC-107");
});

test("applies severity_filter correctly", () => {
  const highOnly = buildAuditResult(sampleDetectors, "high", 1.2);
  assert.equal(highOnly.total_issues, 1);
  assert.equal(highOnly.high, 1);
  assert.equal(highOnly.medium, 0);
  assert.equal(highOnly.issues[0].title, "reentrancy-eth");
});
