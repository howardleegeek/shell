import { generateSolidityNatSpec, generateRustAnchorDoc } from '../../components/workbench/docGenerators'

describe('Solidity NatSpec generation', () => {
  test('inserts NatSpec above function', () => {
    const code = `pragma solidity ^0.8.0;
contract Example {
  function setValue(uint256 newValue) external {
    // set value
  }
}`
    const out = generateSolidityNatSpec(code)
    expect(out).toContain('* @title setValue')
    expect(out).toContain('* @param newValue Auto-generated doc for parameter newValue')
  })
})

describe('Rust Anchor doc generation', () => {
  test('inserts doc above function and field docs', () => {
    const code = `pub struct MyAccount {
  pub owner: Pubkey,
  pub balance: u64,
}

pub fn process_instruction(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) {
  // handler
}`
    const out = generateRustAnchorDoc(code)
    expect(out).toContain('/// Auto-generated doc for function process_instruction')
    expect(out).toContain('/// owner - auto-documented field of MyAccount')
  })
})
