const fs = require('node:fs');
const path = require('node:path');

const MAX_REPORT_SIZE = 10 * 1024 * 1024;

function classifyError(message) {
  const text = String(message || '').toLowerCase();
  if (/assert|expectation failed/.test(text)) return 'assertion';
  if (/overflow|underflow|panic code 0x11/.test(text)) return 'overflow';
  if (/out of gas|gas exceeded|insufficient gas/.test(text)) return 'gas';
  if (/revert|panic|invalid opcode/.test(text)) return 'revert';
  return 'other';
}

function classifyFixCategory(errorType, message) {
  const text = String(message || '').toLowerCase();
  if (/onlyowner|access|unauthorized|permission|role/.test(text)) return 'access_control';
  if (errorType === 'overflow') return 'arithmetic';
  if (/balance|allowance|nonce|state|storage/.test(text)) return 'state';
  return 'logic';
}

function parseSourceLocation(message, file, line) {
  if (file && Number.isFinite(line)) return { file, line: Number(line) };
  const match = String(message || '').match(/([\w./-]+\.[A-Za-z0-9]+):(\d+)/);
  if (!match) return { file: 'unknown', line: 0 };
  return { file: match[1], line: Number(match[2]) };
}

function fileExists(target) {
  try {
    fs.accessSync(target, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function collectJsonFiles(projectDir) {
  const roots = [projectDir, path.join(projectDir, 'reports'), path.join(projectDir, 'out')];
  const files = [];
  for (const root of roots) {
    if (!fileExists(root)) continue;
    const entries = fs.readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) files.push(path.join(root, entry.name));
    }
  }
  return files;
}

function latestForgeOutput(projectDir) {
  const files = collectJsonFiles(projectDir);
  const forgeLike = files.filter((candidate) => /forge|test-results/i.test(path.basename(candidate)));
  forgeLike.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return forgeLike[0];
}

function buildCandidates(input) {
  const projectDir = input.project_dir;
  const forge = [path.join(projectDir, 'out', 'test-results.json'), latestForgeOutput(projectDir)].filter(Boolean);
  const hardhat = [path.join(projectDir, 'test-results.json')];
  const anchor = [path.join(projectDir, '.anchor', 'test-results.json')];

  if (input.report_path) return [path.resolve(input.report_path)];
  if (input.format === 'forge') return forge;
  if (input.format === 'hardhat') return hardhat;
  if (input.format === 'anchor') return anchor;

  return [...forge, ...hardhat, ...anchor].sort((a, b) => {
    if (!fileExists(a)) return 1;
    if (!fileExists(b)) return -1;
    return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs;
  });
}

function pickReportPath(input) {
  const candidates = buildCandidates(input);
  return candidates.find((candidate) => fileExists(candidate));
}

function normalizeFailure(entry, defaults) {
  const testName = String(entry.test ?? entry.test_name ?? entry.name ?? defaults.test);
  const contract = String(entry.contract ?? defaults.contract ?? '');
  const message = String(entry.message ?? entry.error ?? entry.reason ?? 'Unknown failure');
  const errorType = classifyError(message);
  return {
    test_name: testName,
    contract,
    error_type: errorType,
    error_message: message,
    source_location: parseSourceLocation(message, entry.file, entry.line),
    suggested_fix_category: classifyFixCategory(errorType, message),
  };
}

function extractFromForge(report) {
  const failures = [];
  const testResults = report.test_results;
  if (!testResults || typeof testResults !== 'object') return failures;

  for (const [contract, tests] of Object.entries(testResults)) {
    if (!tests || typeof tests !== 'object') continue;
    for (const [testName, details] of Object.entries(tests)) {
      const status = String(details.status ?? '').toLowerCase();
      if (!status || ['success', 'pass', 'passed', 'ok'].includes(status)) continue;
      failures.push(normalizeFailure(details, { test: testName, contract }));
    }
  }
  return failures;
}

function extractFromKnownArrays(report) {
  const failures = [];
  const details = report.details || {};
  const errors = details.errors ?? report.failures ?? report.tests ?? [];
  for (const entry of errors) {
    if (!entry || typeof entry !== 'object') continue;
    const status = String(entry.status ?? entry.result ?? '').toLowerCase();
    const passed = entry.passed;
    if (status && ['success', 'pass', 'passed', 'ok'].includes(status)) continue;
    if (typeof passed === 'boolean' && passed) continue;
    failures.push(normalizeFailure(entry, { test: 'unknown', contract: String(entry.contract ?? '') }));
  }
  return failures;
}

function extractGasReport(report) {
  const details = report.details || {};
  const raw = report.gas_report ?? report.gas ?? details.gas ?? [];
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      contract: String(entry.contract ?? ''),
      function: String(entry.function ?? ''),
      avg_gas: Number(entry.avg_gas ?? entry.average_gas ?? entry.avg ?? 0),
      median_gas: Number(entry.median_gas ?? entry.median ?? 0),
    }));
}

function extractSummary(report, failures) {
  if (report.summary && typeof report.summary === 'object') {
    return {
      total: Number(report.summary.total ?? 0),
      passed: Number(report.summary.passed ?? 0),
      failed: Number(report.summary.failed ?? 0),
      skipped: Number(report.summary.skipped ?? 0),
    };
  }

  const details = report.details || {};
  const passed = Number(details.passed ?? report.passed ?? 0);
  const failed = Number(details.failed ?? report.failed ?? failures.length);
  const skipped = Number(details.skipped ?? report.skipped ?? 0);
  const total = Number(details.total ?? report.total ?? passed + failed + skipped);
  return { total, passed, failed, skipped };
}

async function readReport(input) {
  const reportPath = pickReportPath(input);
  if (!reportPath) return { error: 'no_report_found', hint: 'Run forge_test first to generate a report' };

  const stats = await fs.promises.stat(reportPath);
  const raw = await fs.promises.readFile(reportPath, 'utf8');
  const report = JSON.parse(raw);

  const failures = [...extractFromKnownArrays(report), ...extractFromForge(report)];
  const summary = extractSummary(report, failures);
  const timestamp = String(report.finishedAt ?? report.startedAt ?? new Date().toISOString());

  if (stats.size > MAX_REPORT_SIZE) return { summary, failures: failures.slice(0, 20), timestamp };

  const gasReport = extractGasReport(report);
  if (gasReport) return { summary, failures, gas_report: gasReport, timestamp };
  return { summary, failures, timestamp };
}

const readReportTool = {
  name: 'read_report',
  description: 'Read and analyze the latest test report. Returns structured failure analysis.',
  inputSchema: {
    type: 'object',
    properties: {
      project_dir: { type: 'string', description: 'Project directory' },
      report_path: { type: 'string', description: 'Optional report file path' },
      format: { type: 'string', enum: ['forge', 'hardhat', 'anchor'], description: 'Report format' },
    },
    required: ['project_dir'],
  },
  execute: readReport,
};

module.exports = {
  readReport,
  readReportTool,
};
