import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TestResultsPanel } from '~/app/components/workbench/TestResultsPanel'
import { testRunStore } from '~/app/lib/stores/test-runner'
import { ParsedTestResults } from '~/app/lib/web3/test-runner'

describe('TestResultsPanel', () => {
  test('renders header when results exist', () => {
    // Inject a mock result into the store
    const results: ParsedTestResults = {
      chainType: 'evm',
      command: 'forge test --json',
      passed: 2,
      failed: 0,
      total: 2,
      duration: '1s',
      tests: [
        { name: 'testOne', status: 'pass', duration: '0.2s' },
        { name: 'testTwo', status: 'pass', duration: '0.3s' },
      ],
      rawOutput: ''
    }
    testRunStore.set({
      isRunning: false,
      chainType: 'evm',
      command: results.command,
      results,
      error: null,
      lastRunAt: null,
    })

    render(<TestResultsPanel />)
    expect(screen.getByText('Test Results')).toBeTruthy()
  })
})
