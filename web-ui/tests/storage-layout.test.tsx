import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StorageLayout from '../src/storage-layout/StorageLayout'

describe('StorageLayout', () => {
  const sample: any[] = [
    { slot: 0, name: 'owner', type: 'address', offset: 0, bytes: 20 },
    { slot: 1, name: 'balance', type: 'uint256', offset: 20, bytes: 12 },
  ]

  it('renders layout table with correct rows and colors', () => {
    render(<StorageLayout layout={sample} />)
    // two rows
    const rows = screen.getAllByRole('row')
    // header row + 2 data rows
    expect(rows.length).toBe(3)
    // color for address should be applied on first row
    const firstCell = screen.getAllByText('owner')[0]
    expect(firstCell).toBeInTheDocument()
  })

  it('decodes a provided hex value for address', async () => {
    render(<StorageLayout layout={sample} />)
    // find first input and type a 32-byte hex with 40 trailing a's
    const inputs = screen.getAllByLabelText(/decode-input-/)
    expect(inputs.length).toBe(2)
    const firstInput = inputs[0] as HTMLInputElement
    const hex = '0x' + '0'.repeat(24 * 1) // not used, will replace with correct length below
    // Build 64 hex chars after 0x: 24 zeros + 40 'a'
    const hexAddress = '0x' + '0'.repeat(24) + 'a'.repeat(40)
    fireEvent.change(firstInput, { target: { value: hexAddress } })
    // decoded value should appear in the corresponding decoded div
    const decoded = await screen.findByTestId('decoded-0')
    expect(decoded.textContent).toBe('0x' + 'a'.repeat(40))
  })
})
