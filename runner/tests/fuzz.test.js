// Lightweight tests for the fuzz runner
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

describe('fuzz.js runner', () => {
  test('writes a fuzz report (dry run)', () => {
    // Use a DRY run to avoid Forge dependency
    const script = path.resolve(__dirname, '../src/fuzz.js')
    // Run with DRY_RUN to simulate a success
    const result = spawnSync('node', [script, '10'], {
      env: { ...process.env, FUZZ_DRY_RUN: '1' },
      stdio: 'inherit',
      encoding: 'utf8'
    })
    // Ensure process exited cleanly or at least we produced a file
    // Look for a fuzz report in the reports directory
    const dir = path.resolve(process.cwd(), 'reports')
    let found = false
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.startsWith('fuzz.') && f.endsWith('.json'))
        found = files.length > 0
      }
    } catch {
      // ignore
    }
    expect(found).toBe(true)
  })
})
