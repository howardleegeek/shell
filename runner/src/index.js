#!/usr/bin/env node
// Minimal runner CLI to support tests for bug 22-27, 40-43, 49-50
"use strict";
const fs = require('fs');
const path = require('path');

function detectProjectType(projectPath) {
  // Normalize path
  const p = path.resolve(projectPath);
  // Solana indicator
  if (fs.existsSync(path.join(p, 'Anchor.toml'))) {
    console.log('solana');
    return;
  }
  // EvM indicator via Foundry or forge toml files
  if (fs.existsSync(path.join(p, 'forge.toml')) || fs.existsSync(path.join(p, 'foundry.toml'))) {
    console.log('evm');
    return;
  }
  console.log('unknown');
}

function listReports(projectPath) {
  const dir = path.join(path.resolve(projectPath), 'reports');
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir).filter((f) => {
      try {
        return fs.statSync(path.join(dir, f)).isFile();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function readReport(projectPath, reportName) {
  const file = path.join(path.resolve(projectPath), 'reports', reportName);
  if (!fs.existsSync(file)) return {};
  try {
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function runDeploy(_projectPath) {
  // Placeholder for actual deploy runner integration
  console.log('deploy');
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (cmd === 'detect') {
    // Expect --project <path>
    const idx = args.indexOf('--project');
    const projectPath = (idx >= 0 && args[idx + 1]) || process.cwd();
    detectProjectType(projectPath);
    return;
  }
  if (cmd === 'list-reports') {
    const idx = args.indexOf('--project');
    const projectPath = (idx >= 0 && args[idx + 1]) || process.cwd();
    const reports = listReports(projectPath);
    console.log(JSON.stringify(reports));
    return;
  }
  if (cmd === 'read-report') {
    // usage: read-report --project <path> <reportName>
    const idx = args.indexOf('--project');
    const projectPath = (idx >= 0 && args[idx + 1]) || process.cwd();
    const reportName = args[args.length - 1] || '';
    const data = readReport(projectPath, reportName);
    console.log(JSON.stringify(data));
    return;
  }
  if (cmd === 'deploy') {
    const projectPath = args.find(a => !a.startsWith('--')) || process.cwd();
    runDeploy(projectPath);
    return;
  }
  // Fallback
  console.log('shell-run: unknown command');
}

main();
