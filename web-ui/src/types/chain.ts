export type ChainMode = 'solana' | 'evm';

export interface ChainConfig {
  network: string;
  rpcUrl: string;
}

export interface SolanConfig extends ChainConfig {
  network: 'devnet' | 'testnet' | 'mainnet';
}

export interface EvmConfig extends ChainConfig {
  network: string;
  chainId: number;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  description: string;
  enabled: boolean;
}

export interface MCPConfig {
  mcpServers: {
    solana: MCPServerConfig;
    evm: MCPServerConfig;
  };
  chainDefaults: {
    solana: SolanConfig;
    evm: EvmConfig;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}
