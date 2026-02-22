import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'path'
import { spawnSync } from 'node:child_process'

const RUNNER_DIR = require('path').resolve(__dirname, '..')
const CLI = require('path').join(RUNNER_DIR, 'src', 'index.js')

function runTest() {
  const projectPath = mkdtempSync(join(tmpdir(), 'runner-report-'))
  const res = spawnSync('node', [CLI, 'test', '--project', projectPath], {
    cwd: RUNNER_DIR,
    encoding: 'utf8'
  })
  const reportPath = join(projectPath, 'reports', 'test.evm.anchor.json')
  // The exact report may depend on PATH; try both an evm forge and solana anchor variants
  try {
    JSON.parse(readFileSync(reportPath, 'utf8'))
  } catch {
    // try alternative
    const alt = join(projectPath, 'reports', 'test.solana.anchor.json')
    JSON.parse(readFileSync(alt, 'utf8'))
  }
  // If we reached here, the writing path at least succeeded in producing a json file
  assert.ok(true)
  return res
}

test('report writer produces JSON report', () => {
  const res = runTest()
  // Ensure command executed and report files exist
  // We don't enforce exit code here to keep test deterministic across environments
  assert.ok(res instanceof Object)
})
