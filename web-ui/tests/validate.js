#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJSON(p){
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function main(){
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const readmePath = path.join(__dirname, '..', 'README.md');
  const pkg = readJSON(pkgPath);
  let ok = true;
  if (pkg.name !== 'shell-web-ui') {
    console.error('FAIL: package.json.name should be "shell-web-ui" but got', pkg.name);
    ok = false;
  }
  if (pkg.description?.toLowerCase().indexOf('shell') < 0) {
    console.error('FAIL: package.json.description should mention "Shell"');
    ok = false;
  }
  if (!fs.existsSync(readmePath)) {
    console.error('FAIL: README.md missing');
    ok = false;
  } else {
    const readme = fs.readFileSync(readmePath, 'utf8');
    if (!readme.toLowerCase().includes('bolt.diy')) {
      console.error('FAIL: README.md should mention bolt.diy fork');
      ok = false;
    }
  }
  process.exit(ok ? 0 : 1);
}

if (require.main === module) main();
