import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const CURRENT_DIR = __dirname
const RUNNER_DIR = resolve(CURRENT_DIR, '..')
const CLI = join(RUNNER_DIR, 'src', 'index.js')

function runDetect(projectPath) {
  return spawnSync('node', [CLI, 'detect', '--project', projectPath], {
    cwd: RUNNER_DIR,
    encoding: 'utf8',
  })
}

test('detects Solana project (Anchor.toml present)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'runner-detect-solana-'))
  // Create a minimal Solana indicator file
  writeFileSync(join(dir, 'Anchor.toml'), 'template = "solana"')
  const result = runDetect(dir)
  assert.equal(result.stdout.trim(), 'solana')
})

test('detects EvM project (forge.toml present)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'runner-detect-evm-'))
  writeFileSync(join(dir, 'forge.toml'), 'version = "0.0.0"')
  const result = runDetect(dir)
  assert.equal(result.stdout.trim(), 'evm')
})
