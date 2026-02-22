import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { chain_status } from '../src/tools/chain-status.ts'

describe('chain_status', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = undefined
  })

  test('offline returns online: false', async () => {
    // @ts-ignore
    global.fetch = async () => { throw new Error('Network error') }
    const res = await chain_status({ rpc_url: 'http://localhost:8545' })
    expect(res?.online).toBe(false)
    expect(res?.error).toBeDefined()
  })

  test('online returns expected fields and node type', async () => {
    // Mock fetch to respond to specific RPC methods
    const responses = new Map<string, any>([
      ['eth_blockNumber', '0xa'],
      ['eth_chainId', '0x1'],
      ['eth_accounts', []],
      ['net_version', '1'],
      ['eth_gasPrice', '0x3b9aca00'],
      ['web3_clientVersion', 'HardhatNetwork/0.0.0']
    ])

    // @ts-ignore
    global.fetch = async (input: any, init: any) => {
      const body = JSON.parse(init?.body || '{}')
      const method = body?.method
      const id = body?.id ?? 1
      const result = responses.get(method) ?? null
      const resp = { jsonrpc: '2.0', id, result }
      return {
        ok: true,
        json: async () => resp
      } as any
    }

    const res = await chain_status({ rpc_url: 'http://localhost:8545' })
    expect(res.online).toBe(true)
    expect(res.chain_id).toBe(1)
    expect(res.block_number).toBe(10)
    expect(res.node_type).toBe('hardhat')
  })
})
