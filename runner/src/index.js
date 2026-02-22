#!/usr/bin/env node
// Simple CLI to run build/test actions for the runner and emit JSON reports.
// Behavior summary:
// - build: always exit with 0. Executes a chain-specific binary (solana -> anchor, evm -> forge).
//   Reports: reports/build.<chain>.<runner>.json with { ok, chain, runner }.
// - test: exits with the child process exit code. Reports: reports/test.<chain>.<runner>.json with { ok, chain, runner }.
// - --help / --h: print a tiny usage message.

"use strict";

const { spawnSync } = require('child_process');
const { join } = require('path');
const { mkdirSync, writeFileSync, existsSync } = require('fs');

function printHelp() {
  console.log('Usage: node index.js <command> --chain <chain> --runner <runner> --project <path>');
  console.log('Commands:');
  console.log('  build  - run a chain-specific build tool and emit a report (exit 0)');
  console.log('  test   - run a chain-specific test tool and emit a report (propagate exit code)');
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const command = argv[0];
  // very small arg parsing: --key value
  const args = argv.slice(1);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = (i + 1) < args.length ? args[i + 1] : undefined;
      if (val === undefined || val.startsWith('--')) {
        opts[key] = true;
      } else {
        opts[key] = val;
        i++;
      }
    }
  }

  const chain = opts.chain;
  const projectPath = opts.project || process.cwd();
  // Build against solana -> anchor, evm -> forge
  let binary = null;
  let runnerName = null;
  if (chain === 'solana') {
    binary = 'anchor';
    runnerName = 'anchor';
  } else if (chain === 'evm') {
    binary = 'forge';
    runnerName = 'forge';
  } else {
    // Unknown chain; just exit gracefully
    console.error('Unknown chain:', chain);
    process.exit(1);
  }

  // Ensure reports dir
  const reportsDir = join(projectPath, 'reports');
  ensureDir(reportsDir);

  // Run the binary. Do not swallow PATH from the environment; tests inject fake binaries via PATH.
  // For build: always exit 0; for test: propagate the child status.
  const res = spawnSync(binary, [], {
    env: process.env,
    encoding: 'utf8',
  });

  const ok = (res.status === 0);

  const report = {
    ok: !!ok,
    chain: chain,
    runner: runnerName,
  };
  const reportPath = join(reportsDir, `${command}.${chain}.${runnerName}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // For build, always exit 0 regardless of child exit code
  if (command === 'build') {
    process.exit(0);
  }
  // For test, propagate child exit code if available; if res.error, piggyback to 1
  if (res.error) {
    process.exit(1);
  } else {
    process.exit(res.status);
  }
}

main();
