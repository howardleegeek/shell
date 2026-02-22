// JavaScript fallback for MCP integration (CommonJS)
class McpClient {
  constructor(endpoint) {
    this.endpoint = endpoint
  }
  getBalance(address) {
    return Promise.resolve('0')
  }
}

function createMcpClientFromConfig(cfg) {
  return new McpClient(cfg.endpoint)
}

function initDefaultMcpClients(baseApiUrl) {
  const solana = createMcpClientFromConfig({ name: 'solana', type: 'solana', endpoint: `${baseApiUrl}/solana` })
  const evm = createMcpClientFromConfig({ name: 'evm', type: 'evm', endpoint: `${baseApiUrl}/evm` })
  return [solana, evm]
}

module.exports = { createMcpClientFromConfig, initDefaultMcpClients, McpClient }
