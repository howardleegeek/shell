import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EvmBenchPanel } from '../components/EvmBenchPanel'

describe('EvmBenchPanel', () => {
  test('renders and runs benchmark via onRun callback', async () => {
    const onRun = jest.fn().mockResolvedValue({ ok: true, details: { gasReport: [], snapshot: {} } })
    render(<EvmBenchPanel onRun={onRun} defaultFuzzRuns={500} />)

    // UI should show header and fuzz runs input
    expect(screen.getByText('EVM Benchmark')).toBeInTheDocument()
    const input = screen.getByLabelText(/Fuzz Runs:/) as HTMLInputElement
    expect(input.value).toBe('500')

    // change fuzz runs value
    fireEvent.change(input, { target: { value: '1000' } })
    expect(input.value).toBe('1000')

    // click Run Benchmark
    const btn = screen.getByRole('button', { name: /Run Benchmark/i })
    fireEvent.click(btn)

    // while running, button should reflect loading
    expect(btn).toBeDisabled()

    // wait for results to appear
    await waitFor(() => expect(onRun).toHaveBeenCalledWith({ fuzzRuns: 1000 }))
    // results block should render JSON
    await waitFor(() => {
      expect(screen.getByText(/\"gasReport\"/)).toBeInTheDocument()
    })
  })
})
