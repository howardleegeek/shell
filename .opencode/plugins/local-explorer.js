// Lightweight JS shim for tests: generate a mock local explorer report.
const fs = require('fs');
const path = require('path');

function nowIso() {
  return new Date().toISOString();
}

async function generateLocalExplorerReport(directory, maxTxs = 5) {
  const startedAt = nowIso();
  const reportsDir = path.join(directory, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  // Mock data by default
  const txs = [
    { hash: '0xdeadbeef1', from: '0xabc1', to: '0xdef1', value: '0x0' },
    { hash: '0xdeadbeef2', from: '0xabc2', to: '0xdef2', value: '0xde0b6b3a7640000' },
  ].slice(0, maxTxs);
  const accounts = [
    { address: '0xabc1', balance: '0' },
    { address: '0xdef1', balance: '0' },
  ];
  const report = {
    ok: true,
    chain: 'evm',
    startedAt,
    finishedAt: nowIso(),
    reportsDir,
    txs,
    accounts,
  };

  const jsonPath = path.join(reportsDir, 'local-explorer.evm.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  report.path = jsonPath;
  return report;
}

module.exports = { generateLocalExplorerReport };
