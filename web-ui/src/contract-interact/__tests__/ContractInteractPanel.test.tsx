import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContractInteractPanel from '../ContractInteractPanel'

const abi = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

describe('ContractInteractPanel', () => {
  test('renders read/write sections and basic interactions', async () => {
    render(<ContractInteractPanel abi={abi as any} address={'0x1a2b3c4d5e6f'} />)

    // Sections exist
    expect(screen.getByText('Read Functions')).toBeInTheDocument()
    expect(screen.getByText('Write Functions')).toBeInTheDocument()
    // Functions exist
    expect(screen.getByText('balanceOf(address)')).toBeInTheDocument()
    expect(screen.getByText('transfer(address, uint256)')).toBeInTheDocument()

    // Read input available for balanceOf
    const input0 = screen.getByTestId('balanceOf-input-0') as HTMLInputElement
    fireEvent.change(input0, { target: { value: '0x00000000000000000000000000000000000000a1' } })

    // Call read function
    const callBtn = screen.getByTestId('call-balanceOf')
    fireEvent.click(callBtn)

    // Expect a result to appear
    await waitFor(() => {
      expect(screen.getByTestId('read-result-balanceOf')).toBeInTheDocument()
      expect(screen.getByTestId('read-result-balanceOf').textContent).toContain('Result:')
    })

    // Prepare inputs for write function and send tx
    const input1 = screen.getByTestId('transfer-input-0') as HTMLInputElement
    const input2 = screen.getByTestId('transfer-input-1') as HTMLInputElement
    fireEvent.change(input1, {
      target: { value: '0x00000000000000000000000000000000000000b1' },
    })
    fireEvent.change(input2, { target: { value: '100' } })

    const sendBtn = screen.getByTestId('send-transfer')
    fireEvent.click(sendBtn)

    // Tx hash should appear
    await waitFor(() => {
      const txEl = screen.getByText(/Tx Hash:/i)
      const gasEl = screen.getByText(/Gas Used:/i)
      expect(txEl).toBeInTheDocument()
      expect(gasEl).toBeInTheDocument()
    })
  })
})
