#!/usr/bin/env node

/**
 * Shell Runner - Unified CLI for Web3 Development
 * 
 * Usage:
 *   shell-run <action> [options]
 * 
 * Actions:
 *   test       - Run tests and generate report
 *   build      - Build contracts and generate report
 *   deploy     - Deploy to testnet and generate report
 *   audit      - Run security audit and generate report
 *   detect     - Detect project type (solana/evm)
 *   report     - Read and display latest report
 * 
 * Options:
 *   --chain    - solana | evm (auto-detect if not specified)
 *   --network  - devnet | sepolia | mainnet
 *   --runner   - foundry | hardhat | anchor
 *   --project  - Path to project (default: cwd)
 *   --output   - Output format: json | text
 * 
 * Examples:
 *   shell-run test
 *   shell-run deploy --network sepolia
 *   shell-run audit --chain solana
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { cwd } from 'process';

const REPORTS_DIR = 'reports';

// ============================================================================
// Report Schema Types
// ============================================================================

/** @typedef {Object} TestReport
 * @property {boolean} ok
 * @property {'evm'|'solana'} chain
 * @property {'forge'|'hardhat'|'anchor'} runner
 * @property {string} startedAt
 * @property {string} finishedAt
 * @property {string} command
 * @property {number} exitCode
 * @property {string} summary
 * @property {Object} [details]
 */

/** @typedef {Object} DeployReport
 * @property {boolean} ok
 * @property {'evm'|'solana'} chain
 * @property {string} network
 * @property {string} contract
 * @property {string} [address]
 * @property {string} [txHash]
 * @property {string} startedAt
 * @property {string} finishedAt
 */

/** @typedef {Object} AuditReport
 * @property {boolean} ok
 * @property {string} tool
 * @property {number} issueCount
 * @property {Array<{severity: string, title: string, file: string}>} issues
 * @property {string} startedAt
 * @property {string} finishedAt
 */

// ============================================================================
// Utilities
// ============================================================================

const nowIso = () => new Date().toISOString();

const ensureDir = (dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

const log = (msg, type = 'info') => {
  const prefix = {
    info: 'ℹ',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[type] || '•';
  console.log(`${prefix} ${msg}`);
};

const runCommand = async (cmd, args, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      process.stderr.write(chunk);
    });
    
    child.on('close', (code) => {
      resolve({ exitCode: code, stdout, stderr });
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
};

const writeReport = (filename, data, dir = cwd()) => {
  const reportsDir = join(dir, REPORTS_DIR);
  ensureDir(reportsDir);
  const filepath = join(reportsDir, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2));
  log(`Report written: ${filepath}`, 'success');
  return filepath;
};

// ============================================================================
// Project Detection
// ============================================================================

/** @returns {'solana'|'evm'|'unknown'} */
const detectProject = (projectPath = cwd()) => {
  const files = readdirSync(projectPath);
  
  if (files.includes('Anchor.toml')) return 'solana';
  if (files.includes('foundry.toml') || files.includes('forge.toml')) return 'evm';
  if (files.includes('hardhat.config.js') || files.includes('hardhat.config.ts')) return 'evm';
  if (files.includes('package.json') && files.includes('contracts')) return 'evm';
  
  return 'unknown';
};

// ============================================================================
// Actions
// ============================================================================

/** @param {Object} options */
const actionTest = async (options) => {
  const chain = options.chain || detectProject();
  const runner = options.runner || (chain === 'solana' ? 'anchor' : 'forge');
  const projectPath = options.project || cwd();
  
  log(`Running test: chain=${chain}, runner=${runner}`, 'info');
  
  const startedAt = nowIso();
  let result;
  
  if (chain === 'solana' && runner === 'anchor') {
    result = await runCommand('anchor', ['test'], projectPath);
  } else if (chain === 'evm' && runner === 'forge') {
    result = await runCommand('forge', ['test'], projectPath);
  } else if (chain === 'evm' && runner === 'hardhat') {
    result = await runCommand('npx', ['hardhat', 'test'], projectPath);
  } else {
    throw new Error(`Unsupported: chain=${chain}, runner=${runner}`);
  }
  
  const finishedAt = nowIso();
  
  // Parse test results - handle both "X passing" and "X passed" formats
  const passed = (result.stdout.match(/(\d+)\s+passing/) || result.stdout.match(/(\d+)\s+passed/) || [])[1] || '0';
  const failed = (result.stdout.match(/(\d+)\s+failing/) || result.stdout.match(/(\d+)\s+failed/) || [])[1] || '0';
  
  // Extract failure details
  const failures = [];
  const failureMatches = result.stdout.matchAll(/\[FAIL:([^\]]+)\]\s+(\S+)/g);
  for (const match of failureMatches) {
    failures.push({
      reason: match[1].trim(),
      test: match[2].trim()
    });
  }
  
  /** @type {TestReport} */
  const report = {
    ok: result.exitCode === 0,
    chain,
    runner,
    startedAt,
    finishedAt,
    command: `${runner} test`,
    exitCode: result.exitCode,
    summary: result.exitCode === 0 
      ? `✅ Tests passed (${passed} passing)` 
      : `❌ Tests failed (${failed} failing)`,
    details: {
      passed: parseInt(passed),
      failed: parseInt(failed),
      errors: result.stderr.split('\n').filter(l => l.includes('Error')),
      failures
    }
  };
  
  const filename = `test.${chain}.${runner}.json`;
  writeReport(filename, report, projectPath);
  
  return report;
};

/** @param {Object} options */
const actionBuild = async (options) => {
  const chain = options.chain || detectProject();
  const runner = options.runner || (chain === 'solana' ? 'anchor' : 'forge');
  const projectPath = options.project || cwd();
  
  log(`Running build: chain=${chain}, runner=${runner}`, 'info');
  
  const startedAt = nowIso();
  let result;
  
  if (chain === 'solana' && runner === 'anchor') {
    result = await runCommand('anchor', ['build'], projectPath);
  } else if (chain === 'evm' && runner === 'forge') {
    result = await runCommand('forge', ['build'], projectPath);
  } else if (chain === 'evm' && runner === 'hardhat') {
    result = await runCommand('npx', ['hardhat', 'compile'], projectPath);
  } else {
    throw new Error(`Unsupported: chain=${chain}, runner=${runner}`);
  }
  
  const finishedAt = nowIso();
  
  /** @type {TestReport} */
  const report = {
    ok: result.exitCode === 0,
    chain,
    runner,
    action: 'build',
    startedAt,
    finishedAt,
    command: runner === 'hardhat' ? 'npx hardhat compile' : `${runner} build`,
    exitCode: result.exitCode,
    summary: result.exitCode === 0 
      ? '✅ Build successful' 
      : '❌ Build failed',
    stdout: result.stdout,
    stderr: result.stderr,
    details: {
      errors: result.stderr.split('\n').filter(l => l.includes('Error'))
    }
  };
  
  const filename = `build.${chain}.${runner}.json`;
  writeReport(filename, report, projectPath);
  
  return report;
};

/** @param {Object} options */
const actionDeploy = async (options) => {
  const chain = options.chain || detectProject();
  const runner = options.runner || (chain === 'solana' ? 'anchor' : 'forge');
  let network = options.network || (chain === 'solana' ? 'devnet' : 'sepolia');
  const projectPath = options.project || cwd();
  
  log(`Running deploy: chain=${chain}, network=${network}`, 'info');
  
  const startedAt = nowIso();
  let result;
  let address = '';
  let txHash = '';
  let rpcUrl = '';
  
  // Handle anvil (local dev network)
  if (network === 'anvil') {
    log('Starting anvil...', 'info');
    // Start anvil in background (fire and forget for demo)
    spawn('anvil', ['--host', '127.0.0.1', '--port', '8545'], { 
      cwd: projectPath,
      detached: true,
      stdio: 'ignore'
    });
    // Wait for anvil to start
    await new Promise(r => setTimeout(r, 3000));
    rpcUrl = 'http://127.0.0.1:8545';
    network = 'local'; // For filename
  }
  
  if (chain === 'solana' && runner === 'anchor') {
    result = await runCommand('anchor', ['deploy', '--provider.cluster', network], projectPath);
    // Extract program ID from output
    const match = result.stdout.match(/ProgramId:\s*([\w]{32,44})/);
    if (match) address = match[1];
  } else if (chain === 'evm' && runner === 'forge') {
    // Try to deploy using DEFAULT_CONTRACT or find .sol file
    // For demo, try SimpleVault
    const deployCmd = `forge create --rpc-url ${rpcUrl || network} --broadcast src/SimpleVault.sol:SimpleVault`;
    result = await runCommand(deployCmd, [], projectPath);
    const addrMatch = result.stdout.match(/Deployed to:\s*(0x[\w]{40})/);
    const txMatch = result.stdout.match(/Transaction hash:\s*(0x[\w]{64})/);
    if (addrMatch) address = addrMatch[1];
    if (txMatch) txHash = txMatch[1];
  } else {
    throw new Error(`Unsupported: chain=${chain}, runner=${runner}`);
  }
  
  const finishedAt = nowIso();
  
  /** @type {DeployReport} */
  const report = {
    ok: result.exitCode === 0,
    chain,
    network: options.network || network,
    runner,
    address,
    txHash,
    rpcUrl: rpcUrl || `https://rpc.${options.network || 'sepolia'}.org`,
    startedAt,
    finishedAt,
    summary: result.exitCode === 0 
      ? `✅ Deployed to ${options.network || 'sepolia'}: ${address}` 
      : `❌ Deploy failed`
  };
  
  const filename = `deploy.${chain}.${options.network || 'sepolia'}.json`;
  writeReport(filename, report, projectPath);
  
  return report;
};

/** @param {Object} options */
const actionAudit = async (options) => {
  const chain = options.chain || detectProject();
  const projectPath = options.project || cwd();
  
  log(`Running audit: chain=${chain}`, 'info');
  
  const startedAt = nowIso();
  const result = await runCommand('slither', ['.', '--json', 'reports/slither.json'], projectPath);
  
  const finishedAt = nowIso();
  
  // Parse slither output for issues
  const issues = [];
  const lines = result.stdout.split('\n');
  let currentIssue = '';
  
  for (const line of lines) {
    if (line.includes('INFO:') || line.includes('WARNING:') || line.includes('HIGH:')) {
      if (currentIssue) issues.push(currentIssue);
      currentIssue = line.trim();
    } else if (currentIssue) {
      currentIssue += ' ' + line.trim();
    }
  }
  if (currentIssue) issues.push(currentIssue);
  
  /** @type {AuditReport} */
  const report = {
    ok: issues.length === 0,
    tool: 'slither',
    chain,
    issueCount: issues.length,
    issues: issues.slice(0, 20).map(i => ({
      severity: i.includes('HIGH:') ? 'high' : i.includes('WARNING:') ? 'medium' : 'low',
      title: i.substring(0, 100),
      file: ''
    })),
    startedAt,
    finishedAt,
    summary: issues.length === 0 
      ? '✅ No issues found' 
      : `⚠️ Found ${issues.length} issues`
  };
  
  const filename = `audit.${chain}.slither.json`;
  writeReport(filename, report, projectPath);
  
  return report;
};

/** @param {Object} options */
const actionReport = async (options) => {
  const reportsDir = join(cwd(), REPORTS_DIR);
  
  if (!existsSync(reportsDir)) {
    log('No reports directory found', 'warn');
    return [];
  }
  
  const files = readdirSync(reportsDir).filter(f => f.endsWith('.json'));
  const reports = files.map(f => {
    const content = readFileSync(join(reportsDir, f), 'utf-8');
    return JSON.parse(content);
  });
  
  // Sort by time, most recent first
  reports.sort((a, b) => 
    new Date(b.finishedAt || b.startedAt).getTime() - 
    new Date(a.finishedAt || a.startedAt).getTime()
  );
  
  if (options.json) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    console.log('\n📊 Recent Reports:\n');
    reports.forEach(r => {
      const status = r.ok ? '✅' : '❌';
      const time = new Date(r.finishedAt || r.startedAt).toLocaleString();
      console.log(`${status} ${r.summary} (${time})`);
    });
  }
  
  return reports;
};

// ============================================================================
// CLI Parser
// ============================================================================

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};
  let action = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      if (value !== true) i++;
    } else if (!action) {
      action = arg;
    }
  }
  
  return { action, options };
};

// ============================================================================
// Main
// ============================================================================

const main = async () => {
  const { action, options } = parseArgs();
  
  if (!action || action === 'help' || action === '-h') {
    console.log(`
🦊 Shell Runner - Unified Web3 CLI

Usage: shell-run <action> [options]

Actions:
  test       Run tests and generate report
  build      Build contracts and generate report  
  deploy     Deploy to testnet and generate report
  audit      Run security audit and generate report
  detect     Detect project type (solana/evm)
  report     Show recent reports

Options:
  --chain    solana | evm (auto-detect if not specified)
  --network  devnet | sepolia | mainnet
  --runner   foundry | hardhat | anchor
  --project  Path to project (default: cwd)
  --json     Output JSON format

Examples:
  shell-run test
  shell-run deploy --network sepolia
  shell-run audit --chain evm
  shell-run report --json
`);
    process.exit(0);
  }
  
  try {
    switch (action) {
      case 'detect': {
        const chain = detectProject(options.project || cwd());
        console.log(chain);
        break;
      }
      case 'test': {
        const report = await actionTest(options);
        log(report.summary, report.ok ? 'success' : 'error');
        break;
      }
      case 'build': {
        const report = await actionBuild(options);
        log(report.summary, report.ok ? 'success' : 'error');
        break;
      }
      case 'deploy': {
        const report = await actionDeploy(options);
        log(report.summary, report.ok ? 'success' : 'error');
        break;
      }
      case 'audit': {
        const report = await actionAudit(options);
        log(report.summary, report.ok ? 'success' : 'warn');
        break;
      }
      case 'report': {
        await actionReport(options);
        break;
      }
      default:
        log(`Unknown action: ${action}`, 'error');
        process.exit(1);
    }
  } catch (err) {
    log(err.message, 'error');
    process.exit(1);
  }
};

main();
