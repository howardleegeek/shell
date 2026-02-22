import { analyzeContract, generateTargetCode, MigrationOptions } from '../../cross_chain_migration/migration'

describe('cross-chain migration analytics', () => {
  test('analyzeContract detects mappings and function signatures', () => {
    const code = `pragma solidity ^0.8.0; contract Test { mapping(address => uint) balances; function transfer(address to, uint amount) public { } }`
    const res = analyzeContract(code)
    expect(res.mappings.length).toBeGreaterThanOrEqual(1)
    expect(res.signaturesConverted.length).toBeGreaterThanOrEqual(1)
  })

  test('generateTargetCode produces a skeleton with migration info', () => {
    const opts: MigrationOptions = {
      sourceChain: 'EVM',
      targetChain: 'Rust/Anchor',
      contractCode: 'contract Test {}',
    }
    const analysis = analyzeContract(opts.contractCode)
    const target = generateTargetCode(opts, analysis)
    expect(typeof target).toBe('string')
    expect(target).toContain('Migration: EVM -> Rust/Anchor')
  })
})
