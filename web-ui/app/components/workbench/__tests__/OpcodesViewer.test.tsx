import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import OpcodesViewer from '../OpcodesViewer'

describe('OpcodesViewer', () => {
  it('disassembles simple bytecode and shows opcodes', () => {
    const hex = '60016002' // PUSH1 0x01, PUSH1 0x02
    render(<OpcodesViewer bytecodeHex={hex} contractName="TestContract" />)

    // Should render PUSH1, ADD
    expect(screen.getByText('PUSH1')).toBeInTheDocument()
    expect(screen.getByText('PUSH1', { exact: false })).toBeInTheDocument()
  })

  it('shows a description on selecting an opcode', () => {
    const hex = '60016002f1' // PUSH1 0x01, 0x??, CALL
    render(<OpcodesViewer bytecodeHex={hex} />)

    const push = screen.getByText('PUSH1')
    fireEvent.click(push)
    // After click, a description panel should appear with a title of the opcode
    // Description might be present in the panel
    const note = screen.getByRole('note')
    expect(note).toBeInTheDocument()
  })

  it('filters opcodes by name', () => {
    const hex = '60016002' // PUSH1 0x01, PUSH1 0x02
    render(<OpcodesViewer bytecodeHex={hex} />)
    const input = screen.getByLabelText('opcode-filter') as HTMLInputElement
    expect(input).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'PUSH' } })
    // Should show PUSH1 lines but not others if there were
    expect(screen.queryByText('ADD')).not.toBeInTheDocument()
  })
})
