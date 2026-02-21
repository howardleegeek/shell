import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NatSpecGenerator } from '../NatSpecGenerator'

describe('NatSpecGenerator', () => {
  test('generates Solidity NatSpec blocks for functions', () => {
    const code = `pragma solidity ^0.8.0;
contract Test {
  function add(uint a, uint b) external pure returns (uint) {
    return a + b;
  }
}`

    let updatedCode = ''
    const onUpdate = (newCode: string) => {
      updatedCode = newCode
    }

    render(<NatSpecGenerator code={code} fileName="Test.sol" onUpdate={onUpdate} />)
    // Click the Generate Docs button
    fireEvent.click(screen.getByLabelText('Generate Docs'))
    // Expect NatSpec blocks to be inserted
    expect(updatedCode).toContain('/**')
    expect(updatedCode).toContain('* @title add')
    expect(updatedCode).toContain('* @param a Auto-generated doc for parameter a')
  })
})
