import { defaultClient } from './index'

export type MCPTool = {
  name: string
  description: string
  run: (params: any) => Promise<any>
}

// Exposed MCP tools that the AI chat can invoke
export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'getBalance',
    description: 'Check balance on a given chain',
    run: async (params: { chain: string; address: string }) => {
      const bal = await defaultClient.getBalance(params.chain, params.address)
      return { balance: bal }
    },
  },
  {
    name: 'readContract',
    description: 'Read a contract on a given chain',
    run: async (params: { chain: string; address: string; data: any }) => {
      return await defaultClient.readContract(params.chain, params.address, params.data)
    },
  },
  {
    name: 'requestAirdrop',
    description: 'Request testnet airdrop (stub)',
    run: async (params: { chain: string; address: string; amount?: number }) => {
      console.log(`Airdrop request to ${params.address} on ${params.chain} (stub)`)
      return { txId: 'airdrop-stub' }
    },
  },
]
