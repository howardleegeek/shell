import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GasProfilerPanel } from '../components/GasProfilerPanel'

describe('GasProfilerPanel', () => {
  test('renders and runs profiler via onRun callback', async () => {
    const onRun = jest.fn().mockResolvedValue({ gasReport: [
      { name: 'transfer', min: 10, avg: 12, max: 15, calls: 1000 },
      { name: 'approve', min: 5, avg: 6, max: 8, calls: 800 },
    ] })
    render(<GasProfilerPanel onRun={onRun} />)

    // UI header should be present
    expect(screen.getByText('Gas Profiler')).toBeInTheDocument()

    // Run button should exist and trigger onRun
    const btn = screen.getByRole('button', { name: /Run Gas Profiling/i })
    fireEvent.click(btn)

    // Button should be disabled while running
    expect(btn).toBeDisabled()

    // Wait for results to appear and verify onRun called
    await waitFor(() => expect(onRun).toHaveBeenCalled())

    // Results block should render JSON
    await waitFor(() => {
      expect(screen.getByText(/"gasReport"/)).toBeInTheDocument()
    })
  })
})
