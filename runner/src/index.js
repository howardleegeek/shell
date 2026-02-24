#!/usr/bin/env node
// Combined runner CLI: build/test (S101) + detect/list-reports/read-report/deploy (S105) + S112 fixes
"use strict";

const { spawnSync } = require('child_process');
const { join, resolve, dirname } = require('path');
const { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync, statSync } = require('fs');

function printHelp() {
  console.log('Usage: node index.js <command> [options]');
  console.log('Commands:');
  console.log('  build    - run a chain-specific build tool and emit a report (exit 0)');
  console.log('  test     - run a chain-specific test tool and emit a report (propagate exit code)');
  console.log('  detect   - detect project type (solana/evm/unknown)');
  console.log('  list-reports - list report files');
  console.log('  read-report  - read a specific report');
  console.log('  deploy   - run deploy');
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function parseOpts(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = (i + 1) < argv.length ? argv[i + 1] : undefined;
      if (val === undefined || val.startsWith('--')) {
        opts[key] = true;
      } else {
        opts[key] = val;
        i++;
      }
    }
  }
  return opts;
}

function detectProjectType(projectPath) {
  const p = resolve(projectPath);
  if (existsSync(join(p, 'Anchor.toml'))) {
    console.log('solana');
    return;
  }
  if (existsSync(join(p, 'forge.toml')) || existsSync(join(p, 'foundry.toml'))) {
    console.log('evm');
    return;
  }
  console.log('unknown');
}

function listReports(projectPath) {
  const dir = join(resolve(projectPath), 'reports');
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter((f) => {
      try { return statSync(join(dir, f)).isFile(); } catch { return false; }
    });
  } catch { return []; }
}

function readReportFile(projectPath, reportName) {
  const file = join(resolve(projectPath), 'reports', reportName);
  if (!existsSync(file)) return {};
  try {
    const content = readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch { return {}; }
}

function writeReport(projectPath, reportName, payload) {
  const reportPath = join(projectPath, 'reports', reportName);
  ensureDir(dirname(reportPath));
  writeFileSync(reportPath, JSON.stringify(payload, null, 2), 'utf8');
}

function runBuildTest(command, opts) {
  const chain = opts.chain;
  const projectPath = opts.project || process.cwd();
  let binary = opts.runner || null;
  let runnerName = binary;
  if (!binary) {
    if (chain === 'solana') { binary = 'anchor'; runnerName = 'anchor'; }
    else if (chain === 'evm') { binary = 'forge'; runnerName = 'forge'; }
    else {
      console.error('Unknown chain:', chain);
      process.exit(1);
    }
  }

  const reportsDir = join(projectPath, 'reports');
  ensureDir(reportsDir);

  const res = spawnSync(binary, [], { cwd: projectPath, env: process.env, encoding: 'utf8' });
  const ok = (res.status === 0);
  const report = { ok: !!ok, chain: chain, runner: runnerName };
  if (res.stdout) report.stdout = res.stdout;
  if (res.stderr) report.stderr = res.stderr;
  writeReport(projectPath, `${command}.${chain}.${runnerName}.json`, report);

  if (command === 'build') process.exit(0);
  if (res.error) process.exit(1);
  else process.exit(res.status);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const command = argv[0];
  const args = argv.slice(1);
  const opts = parseOpts(args);

  if (command === 'build' || command === 'test') {
    runBuildTest(command, opts);
    return;
  }
  if (command === 'detect') {
    const projectPath = opts.project || process.cwd();
    detectProjectType(projectPath);
    return;
  }
  if (command === 'list-reports') {
    const projectPath = opts.project || process.cwd();
    const reports = listReports(projectPath);
    console.log(JSON.stringify(reports));
    return;
  }
  if (command === 'read-report') {
    const projectPath = opts.project || process.cwd();
    const reportName = args[args.length - 1] || '';
    const data = readReportFile(projectPath, reportName);
    console.log(JSON.stringify(data));
    return;
  }
  if (command === 'deploy') {
    console.log('deploy');
    return;
  }
  console.log('shell-run: unknown command');
}

main();
