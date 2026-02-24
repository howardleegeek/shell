// Simple test to ensure the lightweight build outputs dist/index.html
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runBuild() {
  const res = execSync('node build.js', { cwd: path.resolve(__dirname), stdio: 'inherit' });
  return res;
}

function main() {
  // Clean previous dist if exists
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  runBuild();
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('Test failed: dist/index.html was not created.');
    process.exit(2);
  }
  console.log('Test passed: dist/index.html exists.');
  process.exit(0);
}

main();
