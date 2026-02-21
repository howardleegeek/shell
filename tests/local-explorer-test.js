// Simple test to exercise the Local Explorer JS shim
const fs = require('fs');
const path = require('path');
const { generateLocalExplorerReport } = require('../.opencode/plugins/local-explorer.js');

(async () => {
  const tmpDir = path.join(__dirname, 'tmp-explorer');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  const report = await generateLocalExplorerReport(tmpDir, 2);
  const p = report.path;
  if (!p || !fs.existsSync(p)) {
    console.error('Local Explorer test failed: report file not found');
    process.exit(2);
  }
  console.log('Local Explorer test passed:', p);
  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(0);
})();
