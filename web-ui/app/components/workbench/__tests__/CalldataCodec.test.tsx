import { decodeCalldata, encodeCalldata } from '../CalldataCodec'
import type { AbiFunction } from '../CalldataCodec'

describe('CalldataCodec basic decoding/encoding', () => {
  test('decode with mockSelector decodes address parameter', () => {
    const abi: AbiFunction[] = [
      {
        name: 'setOwner',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        mockSelector: 'deadbeef',
      },
    ]
    const address = '0x1111111111111111111111111111111111111111'
    const hex = '0x' + 'deadbeef' + '0'.repeat(48) + address.substring(2)
    const res = decodeCalldata(hex, abi)
    expect(res.functionName).toBe('setOwner')
    expect(res.params).toEqual([address])
  })

  test('decode with ethers path works for ABI without mockSelector', () => {
    const abi: AbiFunction[] = [
      {
        name: 'setOwner',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
      },
    ]
    const address = '0x2222222222222222222222222222222222222222'
    // Use encodeCalldata to generate a valid calldata hex for deterministic decoding
    const fn = abi[0]
    const hex = encodeCalldata(fn, [address])
    const res = decodeCalldata(hex, abi)
    expect(res.functionName).toBe('setOwner')
    expect(res.params).toEqual([address])
  })

  test('decode raw when no ABI is provided', () => {
    const selector = 'abcdef12'
    const rest1 = '0'.repeat(64)
    const rest2 = '1'.repeat(64)
    const hex = '0x' + selector + rest1 + rest2
    const res = decodeCalldata(hex, [])
    expect(res.selector).toBe('0x' + selector)
    expect(res.rawParams?.length).toBe(2)
  })

  test('encode with ABI produces calldata', () => {
    const abi: AbiFunction[] = [
      { name: 'setOwner', type: 'function', inputs: [{ name: 'owner', type: 'address' }] },
    ]
    const fn = abi[0]
    const address = '0x3333333333333333333333333333333333333333'
    const hex = encodeCalldata(fn, [address])
    expect(hex.startsWith('0x')).toBe(true)
    const decoded = decodeCalldata(hex, abi)
    expect(decoded.functionName).toBe('setOwner')
    expect(decoded.params).toEqual([address])
  })

  test('encode with derived (no ABI) using mockSelector', () => {
    const derivedFn: AbiFunction = {
      name: 'doThing',
      type: 'function',
      inputs: [{ name: 'recipient', type: 'address' }],
      mockSelector: 'deadbeef',
    }
    const address = '0x4444444444444444444444444444444444444444'
    const hex = encodeCalldata(derivedFn, [address])
    // Expect selector + encoded address in the body
    expect(hex.startsWith('0xdeadbeef')).toBe(true)
  })
})
