import { describe, it, expect } from 'vitest'
import { encodeCalldata, decodeCalldata } from './calldata'
import { ethers } from 'ethers'

describe('Calldata utils', () => {
  const abi = [
    {
      type: 'function',
      name: 'transfer',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    },
  ] as const

  it('encodes and decodes transfer', () => {
    const iface = new ethers.Interface(abi as any)
    const to = '0x1111111111111111111111111111111111111111'
    const amount = 1000
    const data = iface.encodeFunctionData('transfer', [to, amount])

    // Decode using our utility
    const dec = decodeCalldata(data, abi as any)
    expect(dec.functionName).toBe('transfer')
    expect(dec.inputs?.length).toBe(2)
    expect(dec.inputs?.[0]).toBe(to)
    // amount is BigNumber -> string
    expect((dec.inputs?.[1] as any).toString()).toBe(amount.toString())
  })

  it('encodes via helper and decodes back', () => {
    const to = '0x2222222222222222222222222222222222222222'
    const amount = 42
    const data = encodeCalldata(abi as any, 'transfer', [to, amount])
    const dec = decodeCalldata(data, abi as any)
    expect(dec.functionName).toBe('transfer')
    expect(dec.inputs?.[0]).toBe(to)
    expect((dec.inputs?.[1] as any).toString()).toBe(amount.toString())
  })

  it('handles bytes and array types', () => {
    // bytes type
    const abiBytes = [
      {
        type: 'function',
        name: 'setBytes',
        inputs: [ { name: 'data', type: 'bytes' } ]
      }
    ] as const
    const ifaceBytes = new ethers.Interface(abiBytes as any)
    const bdata = '0xdeadbeef'
    const encodedBytes = ifaceBytes.encodeFunctionData('setBytes', [bdata])
    const decBytes = decodeCalldata(encodedBytes, abiBytes as any)
    expect(decBytes.functionName).toBe('setBytes')
    expect(decBytes.inputs?.[0]).toBe(bdata)

    // uint256[] array type
    const abiArray = [
      {
        type: 'function',
        name: 'setArray',
        inputs: [ { name: 'values', type: 'uint256[]' } ]
      }
    ] as const
    const ifaceArray = new ethers.Interface(abiArray as any)
    const dataArr = ifaceArray.encodeFunctionData('setArray', [[1, 2, 3]])
    const decArray = decodeCalldata(dataArr, abiArray as any)
    expect(decArray.functionName).toBe('setArray')
    // values should be an array of strings due to BigNumber normalization
    expect(Array.isArray(decArray.inputs?.[0] as any)).toBe(true)
    const arr = decArray.inputs?.[0] as any[]
    expect(arr.length).toBe(3)
    expect(arr[0]).toBe('1')
    expect(arr[1]).toBe('2')
    expect(arr[2]).toBe('3')
  })
})
