import { buildStepVars, fallbackLineFromTrace } from '../DebuggerPanel'

describe('DebuggerPanel helpers', () => {
  it('maps opcode to likely solidity source line', () => {
    const source = [
      'pragma solidity ^0.8.20;',
      'contract Box {',
      '  uint256 public value;',
      '  function set(uint256 next) external {',
      '    value = next;',
      '  }',
      '}',
    ].join('\n')

    const line = fallbackLineFromTrace('SSTORE', 14, source)
    expect(line).toBe(5)
  })

  it('derives debugger variables from tx details and step snapshot', () => {
    const vars = buildStepVars(
      {
        index: 0,
        op: 'SSTORE',
        pc: 20,
        gas: 1000,
        gasCost: 200,
        stack: [],
        memory: [],
        storage: [{ slot: '0x0', value: '0x123' }],
      },
      {
        from: '0xabc',
        value: '0x5',
        blockNumber: '0x8',
        input:
          '0x01234567' +
          '000000000000000000000000000000000000000000000000000000000000000f' +
          '0000000000000000000000000000000000000000000000000000000000000010',
      },
    )

    expect(vars.msgSender).toBe('0xabc')
    expect(vars.msgValue).toBe('0x5')
    expect(vars.blockNumber).toBe('0x8')
    expect(vars.locals[0]).toEqual({
      name: 'arg0',
      value: '0x000000000000000000000000000000000000000000000000000000000000000f',
    })
    expect(vars.storage[0]).toEqual({
      name: 'slot_0(0x0)',
      value: '0x123',
    })
  })
})
