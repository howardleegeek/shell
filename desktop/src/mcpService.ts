import { mcpManager, ChainMode } from './mcpManager';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPServiceConfig {
  name: string;
  url: string;
  tools: MCPTool[];
}

const SOLANA_TOOLS: MCPTool[] = [
  {
    name: 'solana_getBalance',
    description: 'Get SOL balance for a wallet address',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Solana wallet address' }
      },
      required: ['address']
    }
  },
  {
    name: 'solana_requestAirdrop',
    description: 'Request SOL airdrop on devnet',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Solana wallet address' },
        amount: { type: 'number', description: 'Amount in SOL' }
      },
      required: ['address', 'amount']
    }
  },
  {
    name: 'solana_getTokenBalance',
    description: 'Get SPL token balance for a wallet',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Solana wallet address' },
        mint: { type: 'string', description: 'Token mint address' }
      },
      required: ['address', 'mint']
    }
  },
  {
    name: 'solana_transferSol',
    description: 'Transfer SOL to another wallet',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Source wallet address' },
        to: { type: 'string', description: 'Destination wallet address' },
        amount: { type: 'number', description: 'Amount in SOL' }
      },
      required: ['from', 'to', 'amount']
    }
  }
];

const EVM_TOOLS: MCPTool[] = [
  {
    name: 'evm_getBalance',
    description: 'Get ETH/native token balance for an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address' },
        network: { type: 'string', description: 'Network name (e.g., ethereum-sepolia)' }
      },
      required: ['address']
    }
  },
  {
    name: 'evm_getERC20Balance',
    description: 'Get ERC-20 token balance for an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address' },
        tokenAddress: { type: 'string', description: 'ERC-20 token contract address' },
        network: { type: 'string', description: 'Network name' }
      },
      required: ['address', 'tokenAddress']
    }
  },
  {
    name: 'evm_readContract',
    description: 'Read data from an EVM contract',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Contract address' },
        abi: { type: 'array', description: 'Contract ABI' },
        method: { type: 'string', description: 'Method name' },
        args: { type: 'array', description: 'Method arguments' },
        network: { type: 'string', description: 'Network name' }
      },
      required: ['address', 'abi', 'method']
    }
  },
  {
    name: 'evm_resolveEns',
    description: 'Resolve ENS name to Ethereum address',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ENS name (e.g., vitalik.eth)' }
      },
      required: ['name']
    }
  }
];

export async function getMCPConfigForMode(mode: ChainMode): Promise<MCPServiceConfig[]> {
  await mcpManager.loadConfig();

  if (mode === 'svm') {
    return [{
      name: 'solana-mcp',
      url: 'http://localhost:3000/solana',
      tools: SOLANA_TOOLS
    }];
  } else {
    return [{
      name: 'evm-mcp-server',
      url: 'http://localhost:3000/evm',
      tools: EVM_TOOLS
    }];
  }
}

export async function initializeMCPForChain(mode: ChainMode): Promise<void> {
  await mcpManager.switchChainMode(mode);
}

export { mcpManager };
