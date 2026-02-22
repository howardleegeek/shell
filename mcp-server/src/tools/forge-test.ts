import { spawn } from 'child_process'
import { once } from 'events'

// Forge test tool: runs `forge test --json` in the given project directory
// and returns a structured summary of test results.

export interface ForgeTestInput {
  project_dir: string
  test_filter?: string
  verbosity?: number
  gas_report?: boolean
}

export interface ForgeTestResult {
  name: string
  status: string // e.g. "passed" | "failed" | "skipped" etc.
  duration_ms?: number
  error?: string
}

export interface ForgeTestOutput {
  success: boolean
  total: number
  passed: number
  failed: number
  tests: ForgeTestResult[]
  gas_report?: any
  error?: string
  install_hint?: string
}

// Run forge test with JSON output and parse it into a structured object
export async function runForgeTest(input: ForgeTestInput): Promise<ForgeTestOutput> {
  const { project_dir, test_filter, verbosity, gas_report } = input

  // Basic validation: project_dir exists and contains foundry.toml
  // We avoid filesystem semantics here since this function runs inside test harnesses
  // and environment should provide the path. The caller can guard, but we do a light check.
  const foundryTomlPath = `${project_dir}/foundry.toml`
  // We won't synchronously stat here; we'll just spawn and let the tool fail if not found.

  const args: string[] = ['test', '--json']
  if (test_filter) {
    args.push('--match-test', test_filter)
  }
  // Verbosity can be mapped to -v flags if forge supports; best effort:
  if (typeof verbosity === 'number' && verbosity > 0) {
    // Forge uses -v for verbosity; allow up to 5 levels
    const v = Math.min(verbosity, 5)
    for (let i = 0; i < v; i++) args.push('-v')
  }

  // gas_report handling is left to user; Forge can emit gas usage in its output.
  // We simply attempt to capture it from the final JSON if present.

  return new Promise<ForgeTestOutput>((resolve) => {
    let stdout = ''
    let stderr = ''

    const proc = spawn('forge', args, {
      cwd: project_dir,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const timeout = setTimeout(() => {
      try {
        proc.kill('SIGKILL')
      } catch {
        // ignore
      }
      resolve({
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        tests: [],
        error: 'timeout',
      })
    }, 120000)

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      if ((err as any).code === 'ENOENT') {
        resolve({
          success: false,
          total: 0,
          passed: 0,
          failed: 0,
          tests: [],
          error: 'forge not found',
          install_hint: 'curl -L https://foundry.paradigm.xyz | bash && foundryup',
        })
        return
      }
      resolve({
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        tests: [],
        error: err.message,
      })
    })

    proc.on('close', (code) => {
      clearTimeout(timeout)
      // Attempt to parse JSON output from stdout
      let parsed: any
      try {
        parsed = JSON.parse(stdout)
      } catch {
        // If stdout isn't a single JSON blob, try to extract last JSON object
        const m = stdout.match(/\{.*\}/s)
        if (m) {
          try {
            parsed = JSON.parse(m[0])
          } catch {
            parsed = null
          }
        } else {
          parsed = null
        }
      }

      const result: ForgeTestOutput = {
        success: code === 0 && parsed ? !!(parsed as any).success !== false : code === 0,
        total: 0,
        passed: 0,
        failed: 0,
        tests: [],
      }

      if (parsed && Array.isArray((parsed as any).tests)) {
        const tests = (parsed as any).tests as any[]
        result.total = tests.length
        for (const t of tests) {
          const name = t?.name ?? ''
          const status = t?.status ?? (t?.passed ? 'passed' : 'failed')
          const duration_ms = typeof t?.duration === 'number' ? t.duration : undefined
          result.tests.push({ name, status, duration_ms })
          if (status === 'passed') result.passed += 1
          else result.failed += 1
        }
      } else {
        // Fallback: if parsed has top-level fields
        if (parsed) {
          if (typeof parsed.total === 'number') result.total = parsed.total
          if (Array.isArray(parsed.tests)) {
            for (const t of parsed.tests) {
              const name = t?.name ?? ''
              const status = t?.status ?? 'unknown'
              result.tests.push({ name, status })
              if (status === 'passed') result.passed += 1
              else result.failed += 1
            }
          }
        }
      }

      // Attach gas report if present and requested
      if (gas_report && (parsed as any)?.gas) {
        result.gas_report = (parsed as any).gas
      }

      // If there were compiler or assertion errors, surface them
      if (stderr && result.tests.length === 0) {
        // no tests parsed but there is error output; surface it as a single error
        result.error = stderr.trim()
      }

      resolve(result)
    })
  })
}

export default {
  name: 'forge_test',
  description: 'Run Foundry tests on Solidity contracts. Returns structured JSON results.',
  inputSchema: {
    project_dir: 'string',
    test_filter: 'string',
    verbosity: 'number',
    gas_report: 'boolean',
  },
  run: runForgeTest,
}
