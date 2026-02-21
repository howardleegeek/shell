import { decodeCalldata, encodeCalldata, AbiFunction } from '../CalldataCodec'

describe('CalldataCodec utilities', () => {
  const abi: AbiFunction[] = [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      mockSelector: 'deadbeef',
    },
  ]

  test('decodeCalldata with ABI maps to function and params', () => {
    // selector deadbeef, to = 0x1111...1111 (20 bytes), amount = 42
    const hex = '0xdeadbeef' +
      '0000000000000000000000001111111111111111111111111111111111111111' +
      '000000000000000000000000000000000000000000000000000000000000002a'
    const res = decodeCalldata(hex, abi)
    expect(res.functionName).toBe('transfer')
    expect(res.params).toEqual(['0x1111111111111111111111111111111111111111', '42'])
  })

  test('decodeCalldata without ABI returns raw selector and params', () => {
    const hex = '0x12345678' + '0000000000000000000000000000000000000000000000000000000000000001' + '0000000000000000000000000000000000000000000000000000000000000002'
    const res = decodeCalldata(hex, [])
    expect(res.selector).toBe('0x12345678')
    expect(res.rawParams?.length).toBe(2)
  })

  test('encodeCalldata produces expected hex', () => {
    const fn = abi[0]
    const addr = '0x1111111111111111111111111111111111111111'
    const amount = '42'
    const out = encodeCalldata(fn, [addr, amount])
    const expected =
      '0xdeadbeef' +
      '0000000000000000000000001111111111111111111111111111111111111111111' +
      '000000000000000000000000000000000000000000000000000000000000002a'
    expect(out).toBe(expected)
  })
})
