import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RUNNER_DIR = resolve(CURRENT_DIR, '..');

function makeExecutable(filePath, contents) {
  writeFileSync(filePath, contents, 'utf8');
  chmodSync(filePath, 0o755);
}

function runBuild({ chain, projectPath, fakeBinPath }) {
  const cli = resolve(RUNNER_DIR, 'src/index.js');
  return spawnSync('node', [cli, 'build', '--chain', chain, '--project', projectPath], {
    cwd: RUNNER_DIR,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBinPath}:${process.env.PATH || ''}`,
    },
  });
}

test('build action writes solana anchor report with required fields', () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-build-solana-'));
  const fakeBinPath = join(projectPath, 'fake-bin');
  mkdirSync(fakeBinPath, { recursive: true });
  makeExecutable(join(fakeBinPath, 'anchor'), '#!/usr/bin/env bash\necho "ProgramId: 7xK2abc"\nexit 0\n');

  const result = runBuild({ chain: 'solana', projectPath, fakeBinPath });
  assert.equal(result.status, 0);

  const reportPath = join(projectPath, 'reports', 'build.solana.anchor.json');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert.equal(report.ok, true);
  assert.equal(report.chain, 'solana');
  assert.equal(report.runner, 'anchor');
  assert.equal(report.action, 'build');
  assert.equal(report.command, 'anchor build');
  assert.equal(report.exitCode, 0);
  assert.ok(typeof report.stdout === 'string');
  assert.ok(typeof report.stderr === 'string');
});

test('build action writes evm forge failure report with stderr', () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-build-evm-'));
  const fakeBinPath = join(projectPath, 'fake-bin');
  mkdirSync(fakeBinPath, { recursive: true });
  makeExecutable(
    join(fakeBinPath, 'forge'),
    '#!/usr/bin/env bash\necho "compiling..."\necho "Error: build failed" 1>&2\nexit 2\n',
  );

  const result = runBuild({ chain: 'evm', projectPath, fakeBinPath });
  assert.equal(result.status, 0);

  const reportPath = join(projectPath, 'reports', 'build.evm.forge.json');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert.equal(report.ok, false);
  assert.equal(report.chain, 'evm');
  assert.equal(report.runner, 'forge');
  assert.equal(report.action, 'build');
  assert.equal(report.command, 'forge build');
  assert.equal(report.exitCode, 2);
  assert.ok(report.stderr.includes('Error: build failed'));
});
