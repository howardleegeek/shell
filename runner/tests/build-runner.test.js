import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const RUNNER_DIR = require('path').resolve(__dirname, '..')
const CLI = require('path').join(RUNNER_DIR, 'src', 'index.js')

function runBuild({ chain, projectPath, fakeBinPath }) {
  const cmd = ['build', '--chain', chain, '--project', projectPath]
  return spawnSync('node', [CLI, ...cmd], {
    cwd: RUNNER_DIR,
    encoding: 'utf8',
    env: { ...process.env, PATH: fakeBinPath + ':' + (process.env.PATH || '') }
  })
}

test('build action writes solana anchor report', () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-build-solana-'))
  const fakeBinPath = join(projectPath, 'bin')
  require('fs').mkdirSync(fakeBinPath, { recursive: true })
  require('fs').writeFileSync(join(fakeBinPath, 'anchor'), '#!/usr/bin/env bash\necho "ProgramId: 7xK2abc"\nexit 0', 'utf8')
  require('fs').chmodSync(join(fakeBinPath, 'anchor'), 0o755)
  const result = runBuild({ chain: 'solana', projectPath, fakeBinPath })
  assert.equal(result.status, 0)
  const reportPath = join(projectPath, 'reports', 'build.solana.anchor.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  assert.equal(report.ok, true)
  assert.equal(report.chain, 'solana')
  assert.equal(report.runner, 'anchor')
})

test('build action writes evm forge failure report', () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-build-evm-'))
  const fakeBinPath = join(projectPath, 'bin')
  require('fs').mkdirSync(fakeBinPath, { recursive: true })
  require('fs').writeFileSync(join(fakeBinPath, 'forge'), '#!/usr/bin/env bash\necho "Error: build failed" 1>&2\nexit 2', 'utf8')
  require('fs').chmodSync(join(fakeBinPath, 'forge'), 0o755)
  const result = runBuild({ chain: 'evm', projectPath, fakeBinPath })
  assert.equal(result.status, 0)
  const reportPath = join(projectPath, 'reports', 'build.evm.forge.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  assert.equal(report.ok, false)
})
