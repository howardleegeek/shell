// Types for MCP integration layer

export type MCPServerConfig = {
  name: string
  repo?: string
  install?: string
  capabilities: string[]
  license?: string
}

export type MCPToolSpec = {
  name: string
  description: string
  run: (...args: any[]) => Promise<any>
}
