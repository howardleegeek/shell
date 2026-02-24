import type { MCPServerConfig } from './types'

// Declares the MCP servers integrated into the UI
export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'solana-mcp',
    repo: 'sendaifun/solana-mcp',
    install: 'npx solana-mcp',
    capabilities: [
      'wallet ops',
      'SPL tokens',
      'NFT minting',
      'TPS metrics',
    ],
    license: 'Apache-2.0',
  },
  {
    name: 'evm-mcp-server',
    repo: 'mcpdotdirect/evm-mcp-server',
    install: 'npx evm-mcp-server',
    capabilities: [
      'balances',
      'contract reads/writes',
      'ERC-20/721/1155',
      'ENS',
    ],
    license: 'MIT',
  },
]

// Lightweight MCP client facade for the UI layer
export class MCPClient {
  constructor(private servers = MCP_SERVERS) {}

  async getBalance(chain: string, address: string): Promise<number> {
    // Placeholder implementation; real integration will call MCP backend
    console.log(`MCPClient.getBalance chain=${chain} address=${address}`)
    return 0
  }

  async readContract(chain: string, address: string, data: any): Promise<any> {
    console.log(
      `MCPClient.readContract chain=${chain} address=${address} data=${JSON.stringify(
        data
      )}`,
    )
    return null
  }
}

export const defaultClient = new MCPClient()
