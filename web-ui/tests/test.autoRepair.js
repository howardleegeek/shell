// Lightweight regression test for AutoRepair v2 scaffold
// It creates a temporary environment with synthetic reports, runs autoRepair,
// and asserts that patch files are generated.
const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function runTest() {
  const base = path.resolve(__dirname, 'autoRepair_env');
  const reports = path.resolve(base, 'reports');
  const patches = path.resolve(base, 'patches');
  ensureDir(reports);
  ensureDir(patches);

  // Create synthetic test report with a failed test
  const testReport = {
    tests: [ { name: 'unit/foo', error: 'Assertion failed: expected true' } ]
  };
  fs.writeFileSync(path.resolve(reports, 'test.sample.json'), JSON.stringify(testReport), 'utf8');

  // Create synthetic audit report with a critical finding
  const auditReport = {
    findings: [ { type: 'Critical', location: 'src/index.ts:10', description: 'RCE risk' } ]
  };
  fs.writeFileSync(path.resolve(reports, 'audit.sample.json'), JSON.stringify(auditReport), 'utf8');

  // Run autoRepair
  const autoRepair = require('../src/autoRepair.js');
  const res = autoRepair.runAutoRepair(base);
  // Expect at least one patch file generated
  const patchFiles = fs.readdirSync(patches).filter(n => n.endsWith('.txt'));
  if (!patchFiles.length) {
    console.error('AUTO-REPAIR TEST FAILED: no patch files generated');
    process.exitCode = 1;
  } else {
    console.log('AUTO-REPAIR TEST PASSED: patches generated', patchFiles);
  }
  // Cleanup: leave artifacts for inspection; not strictly required
}

try {
  runTest();
} catch (e) {
  console.error('AUTO-REPAIR TEST FAILED:', e && e.message ? e.message : e);
  process.exitCode = 1;
}
