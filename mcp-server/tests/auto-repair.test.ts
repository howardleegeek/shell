import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { analyzeRepair } from "../src/tools/auto-repair.ts";

function fail(msg: string): never {
  console.error("TEST FAILED:", msg);
  process.exit(1);
}

function assert(condition: unknown, msg: string): void {
  if (!condition) {
    fail(msg);
  }
}

function writeFixture(projectDir: string, relativePath: string, content: string): void {
  const absolutePath = path.join(projectDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function isUnifiedDiff(patch: string, file: string): boolean {
  const normalized = file.replaceAll("\\", "/");
  return (
    patch.includes(`diff --git a/${normalized} b/${normalized}`) &&
    patch.includes(`--- a/${normalized}`) &&
    patch.includes(`+++ b/${normalized}`) &&
    /@@ -\d+,0 \+\d+,1 @@/.test(patch)
  );
}

function testAssertionPatch(projectDir: string): void {
  const file = "src/Calculator.t.sol";
  writeFixture(
    projectDir,
    file,
    [
      "contract CalculatorTest {",
      "  function test_Add() public {",
      "    uint256 actual = 5;",
      "    uint256 expected = 3;",
      "    assertEq(actual, expected);",
      "  }",
      "}",
      "",
    ].join("\n"),
  );

  const out = analyzeRepair({
    project_dir: projectDir,
    report: {
      failures: [
        {
          failure: "Assertion failed: expected 3, got 5",
          source_location: `${file}:5`,
        },
      ],
    },
  });

  assert(out.analysis.length === 1, "assertion case should return one analysis item");
  assert(out.analysis[0].category === "assertion", "category should be assertion");
  assert(out.analysis[0].affected_lines[0] === 5, "assertion should target assert line");
  assert(isUnifiedDiff(out.analysis[0].patch, file), "assertion patch should be valid unified diff");
  assert(out.confidence === "high", "assertion confidence should be high with known file");
}

function testRevertRequireLocation(projectDir: string): void {
  const file = "src/Vault.sol";
  writeFixture(
    projectDir,
    file,
    [
      "contract Vault {",
      "  address private owner;",
      "  function withdraw() public {",
      "    require(msg.sender == owner, \"NOT_OWNER\");",
      "  }",
      "}",
      "",
    ].join("\n"),
  );

  const out = analyzeRepair({
    project_dir: projectDir,
    report: {
      failures: [
        {
          failure: "execution reverted: NOT_OWNER",
          source_location: `${file}:3`,
        },
      ],
    },
  });

  assert(out.analysis.length === 1, "revert case should return one analysis item");
  assert(out.analysis[0].category === "revert", "category should be revert");
  assert(out.analysis[0].affected_lines[0] === 4, "revert case should locate require line");
  assert(isUnifiedDiff(out.analysis[0].patch, file), "revert patch should be valid unified diff");
}

function testMaxPatchesAndConfidence(projectDir: string): void {
  const file = "src/Counter.sol";
  writeFixture(projectDir, file, "contract Counter {}\n");
  const out = analyzeRepair({
    project_dir: projectDir,
    report: {
      failures: [
        { failure: "Assertion failed: expected 1, got 0", source_location: `${file}:1` },
        { failure: "execution reverted: OOPS", source_location: `${file}:1` },
        { failure: "out of gas", source_location: `${file}:1` },
        { failure: "mystery failure" },
      ],
    },
    max_patches: 3,
  });

  assert(out.total_failures_analyzed === 3, "max_patches should cap analyzed failures");
  assert(out.confidence === "high", "confidence should be high for known categories with context");
  for (const item of out.analysis) {
    assert(item.patch.split("\n").length <= 50, "patch must change <= 50 lines");
  }
}

function runTests(): void {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "auto-repair-"));
  try {
    testAssertionPatch(projectDir);
    testRevertRequireLocation(projectDir);
    testMaxPatchesAndConfidence(projectDir);
    console.log("TEST PASSED: auto-repair analyzer");
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
}

runTests();
