import type { MCPConfig, ChainMode } from '../types/chain';

const DEFAULT_MCP_CONFIG: MCPConfig = {
  mcpServers: {
    solana: {
      name: 'Solana MCP',
      command: 'npx',
      args: ['solana-mcp'],
      env: {
        RPC_URL: 'https://api.devnet.solana.com',
        NETWORK: 'devnet',
      },
      description: 'Solana blockchain interaction',
      enabled: false,
    },
    evm: {
      name: 'EVM MCP',
      command: 'npx',
      args: ['evm-mcp-server'],
      env: {
        RPC_URL: 'https://ethereum-sepolia.publicnode.com',
        CHAIN_ID: '11155111',
      },
      description: 'EVM blockchain interaction',
      enabled: false,
    },
  },
  chainDefaults: {
    solana: {
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
    },
    evm: {
      network: 'sepolia',
      chainId: 11155111,
      rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    },
  },
};

let cachedConfig: MCPConfig | null = null;

export async function loadMCPConfig(): Promise<MCPConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/mcp-servers.json');
    if (response.ok) {
      cachedConfig = await response.json();
      return cachedConfig!;
    }
  } catch {
    console.warn('[MCP] Failed to load mcp-servers.json, using defaults');
  }

  cachedConfig = DEFAULT_MCP_CONFIG;
  return cachedConfig;
}

export function getServerConfigForChain(mode: ChainMode): MCPConfig['mcpServers'][ChainMode] {
  const config = DEFAULT_MCP_CONFIG;
  return config.mcpServers[mode];
}

export function getChainDefaultsForMode(mode: ChainMode): MCPConfig['chainDefaults'][ChainMode] {
  const config = DEFAULT_MCP_CONFIG;
  return config.chainDefaults[mode];
}
