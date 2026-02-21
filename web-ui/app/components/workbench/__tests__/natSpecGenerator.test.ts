import React from 'react'
import { detectLanguage, planDocsForSolidity, planDocsForRust } from '../../NatSpecGenerator'

describe('Language detection', () => {
  test('detects solidity', () => {
    const code = `pragma solidity ^0.8.0;
contract Test {
  function add(uint a, uint b) public pure returns (uint) {
    return a + b;
  }
}`
    expect(detectLanguage(code)).toBe('solidity')
  })

  test('detects rust anchor', () => {
    const code = `use anchor_lang::prelude::*;
    #[program]
    pub mod mysolana {
      pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        Ok(())
      }
    }`
    expect(detectLanguage(code)).toBe('rust')
  })
})

describe('Doc plan generators', () => {
  test('solidity plan creates blocks above functions', () => {
    const code = `pragma solidity ^0.8.0;
contract Test {
  function add(uint a, uint b) public pure returns (uint) {
    return a + b;
  }
}`
    const blocks = planDocsForSolidity(code)
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks[0].line).toBe(3) // function line
    expect(blocks[0].comment.startsWith('/**')).toBe(true)
  })

  test('rust plan creates doc lines above handlers', () => {
    const code = `use anchor_lang::prelude::*;
#[program]
pub mod mysolana {
  pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
    Ok(())
  }
}`
    const blocks = planDocsForRust(code)
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks[0].line).toBe(5) // pub fn line inside module
    expect(blocks[0].comment.startsWith('///')).toBe(true)
  })
})
