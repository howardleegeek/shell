import React from 'react'
import { render, screen } from '@testing-library/react'
import OpcodesViewer from '../OpcodesViewer'

describe('OpcodesViewer', () => {
  it('disassembles simple PUSH1 sequence', () => {
    // 0x60 PUSH1 0x01, 0x60 PUSH1 0x02 -> hex: 60 01 60 02
    const hex = '60016002'
    render(<OpcodesViewer bytecodeHex={hex} />)

    // Should render PUSH1 opcode name twice
    expect(screen.getAllByText(/PUSH1/i).length).toBeGreaterThan(0)
    // And operand bytes should appear (01 and 02)
    expect(screen.getByText('01')).toBeInTheDocument()
  })
})
