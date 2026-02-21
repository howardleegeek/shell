#!/usr/bin/env node

// Lightweight fuzz runner for Foundry Forge tests
// Executes: forge test --match-contract Invariant --fuzz-runs <N>
// Produces a JSON report under: reports/fuzz.<timestamp>.json
// If FUZZ_DRY_RUN=1 is set, this exits with a simulated success.

const path = require('path')
const fs = require('fs')
const { spawnSync } = require('child_process')

const args = process.argv.slice(2)
const runs = Number(args[0]) || 100

const REPORTS_DIR = path.resolve(process.cwd(), 'reports')

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const writeReport = (report) => {
  ensureDir(REPORTS_DIR)
  const filename = `fuzz.${Date.now()}.json`
  const fp = path.join(REPORTS_DIR, filename)
  fs.writeFileSync(fp, JSON.stringify(report, null, 2))
  return filename
}

let report = {
  ok: true,
  totalRuns: runs,
  failures: 0,
  counterexamples: []
}

try {
  if (process.env.FUZZ_DRY_RUN === '1') {
    // Simulated success
    report.ok = true
    report.failures = 0
    report.counterexamples = []
  } else {
    // Run Forge fuzz tests
    const res = spawnSync('forge', ['test', '--match-contract', 'Invariant', '--fuzz-runs', String(runs)], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
      encoding: 'utf8'
    })
    const stdout = res.stdout || ''
    const lines = stdout.split(/\r?\n/)
    let failures = 0
    const cex = []
    for (const line of lines) {
      const m = line.match(/(\d+)\s*(failing|failures|failed|passes|passed)/i)
      if (m) {
        const label = line.toLowerCase()
        if (/(failing|failures|failed)/.test(label)) {
          const num = parseInt(m[1], 10)
          if (!Number.isNaN(num)) failures = Math.max(failures, num)
        }
      }
      const ce = line.match(/Counterexample:\s*(.*)/i)
      if (ce) {
        cex.push(ce[1].trim())
      }
    }
    report.ok = res.status === 0
    report.failures = failures
    report.counterexamples = cex
  }
} catch (e) {
  report.ok = false
  report.counterexamples = [`Error: ${e?.message ?? String(e)}`]
}

const filename = writeReport(report)
console.log(`Wrote fuzz report: ${filename}`)
process.exit(report.ok ? 0 : 1)
