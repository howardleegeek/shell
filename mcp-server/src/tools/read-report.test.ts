const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { readReport, readReportTool } = require('./read-report.ts');

function makeTmpDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
}

test('tool metadata matches MCP contract', () => {
  assert.equal(readReportTool.name, 'read_report');
  assert.equal(typeof readReportTool.description, 'string');
  assert.ok(readReportTool.inputSchema.properties.project_dir);
});

test('reads forge report and classifies failures', async () => {
  const projectDir = makeTmpDir('read-report-forge');
  const reportPath = path.join(projectDir, 'out', 'test-results.json');

  writeJson(reportPath, {
    summary: { total: 2, passed: 1, failed: 1, skipped: 0 },
    finishedAt: '2026-02-22T00:00:00.000Z',
    test_results: {
      'test/Counter.t.sol:CounterTest': {
        testIncrement: { status: 'Success' },
        testOnlyOwner: {
          status: 'Failure',
          message: 'execution reverted: onlyOwner at test/Counter.t.sol:42',
        },
      },
    },
  });

  const result = await readReport({ project_dir: projectDir, format: 'forge' });
  assert.ok(result.summary);
  assert.deepEqual(result.summary, { total: 2, passed: 1, failed: 1, skipped: 0 });
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].error_type, 'revert');
  assert.equal(result.failures[0].suggested_fix_category, 'access_control');
  assert.deepEqual(result.failures[0].source_location, { file: 'test/Counter.t.sol', line: 42 });
});

test('returns friendly error when no report is found', async () => {
  const projectDir = makeTmpDir('read-report-empty');
  const result = await readReport({ project_dir: projectDir });
  assert.deepEqual(result, {
    error: 'no_report_found',
    hint: 'Run forge_test first to generate a report',
  });
});

test('truncates failures for reports larger than 10MB', async () => {
  const projectDir = makeTmpDir('read-report-large');
  const reportPath = path.join(projectDir, 'test-results.json');

  const failures = Array.from({ length: 25 }, (_, i) => ({
    test_name: `test_${i}`,
    contract: 'BigContract',
    message: `assertion failed #${i}`,
  }));

  writeJson(reportPath, {
    summary: { total: 25, passed: 0, failed: 25, skipped: 0 },
    details: { errors: failures },
    padding: 'x'.repeat(10 * 1024 * 1024 + 256),
  });

  const result = await readReport({ project_dir: projectDir, format: 'hardhat' });
  assert.ok(result.summary);
  assert.equal(result.failures.length, 20);
  assert.equal(result.failures[0].error_type, 'assertion');
  assert.equal(result.summary.failed, 25);
  assert.equal('gas_report' in result, false);
});
