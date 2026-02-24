// Lightweight MCP integration facade for the web UI
// This module provides a small, testable API surface for
// interacting with MCP servers (Solana and EVM) from the UI.

export type McpServerType = 'solana' | 'evm'

export interface McpServerConfig {
  name: string
  type: McpServerType
  endpoint: string
}

export class McpClient {
  constructor(public endpoint: string) {}

  // Placeholder: would call MCP server to fetch balance
  async getBalance(address: string): Promise<string> {
    // In a real implementation, this would perform a fetch to the MCP server.
    // Here we return a deterministic stub to keep tests deterministic.
    return Promise.resolve("0");
  }
}

export function createMcpClientFromConfig(cfg: McpServerConfig): McpClient {
  return new McpClient(cfg.endpoint)
}

// Convenience: create a default Solana and EVM client list from a base API URL
export function initDefaultMcpClients(baseApiUrl: string): McpClient[] {
  const solana = createMcpClientFromConfig({ name: 'solana', type: 'solana', endpoint: `${baseApiUrl}/solana` })
  const evm = createMcpClientFromConfig({ name: 'evm', type: 'evm', endpoint: `${baseApiUrl}/evm` })
  return [solana, evm]
}

export default { createMcpClientFromConfig, initDefaultMcpClients }
