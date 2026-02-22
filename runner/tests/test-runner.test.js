import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const CURRENT_DIR = __dirname
const RUNNER_DIR = resolve(CURRENT_DIR, '..')
const CLI = join(RUNNER_DIR, 'src', 'index.js')

function runTest({ chain, runner, projectPath, fakeBinPath }) {
  const cmd = ['test', '--chain', chain, '--runner', runner, '--project', projectPath]
  const res = spawnSync('node', [CLI, ...cmd], {
    cwd: RUNNER_DIR,
    encoding: 'utf8',
    env: { ...process.env, PATH: fakeBinPath + ':' + (process.env.PATH || '') }
  })
  return res
}

function makeFakeBin(dir, name, content) {
  const binDir = dir
  const path = join(binDir, name)
  writeFileSync(path, content, 'utf8')
  return path
}

test('runner test action succeeds with fake anchor (solana)', () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-test-solana-'))
  // Fake binary for anchor that prints a simple passing test
  const fakeBinDir = join(projectPath, 'bin')
  require('fs').mkdirSync(fakeBinDir, { recursive: true })
  makeFakeBin(fakeBinDir, 'anchor', '#!/usr/bin/env bash\necho "4 passing"\nexit 0')
  // Make executable
  require('fs').chmodSync(join(fakeBinDir, 'anchor'), 0o755)

  const result = runTest({ chain: 'solana', runner: 'anchor', projectPath, fakeBinPath: fakeBinDir })
  // CLI helper writes JSON report; ensure exit code 0
  assert.equal(result.status, 0)
  const reportPath = join(projectPath, 'reports', 'test.solana.anchor.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  assert.equal(report.ok, true)
  assert.equal(report.chain, 'solana')
  assert.equal(report.runner, 'anchor')
})

test('runner test action failure with fake forge (evm)', () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-test-evm-'))
  const fakeBinDir = join(projectPath, 'bin')
  require('fs').mkdirSync(fakeBinDir, { recursive: true })
  // forge prints error and exit code 2
  const forgeScript = '#!/usr/bin/env bash\necho "Error: build failed" 1>&2\necho "1 passing"\nexit 2'
  writeFileSync(join(fakeBinDir, 'forge'), forgeScript, 'utf8')
  require('fs').chmodSync(join(fakeBinDir, 'forge'), 0o755)

  const result = runTest({ chain: 'evm', runner: 'forge', projectPath, fakeBinPath: fakeBinDir })
  assert.equal(result.status, 2)
  const reportPath = join(projectPath, 'reports', 'test.evm.forge.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  assert.equal(report.ok, false)
})
