import type { ChainMode, MCPTool, MCPToolResult } from '../types/chain';
import { loadMCPConfig, getServerConfigForChain } from './config';

export interface MCPClient {
  serverName: string;
  chainMode: ChainMode;
  process?: Deno.ChildProcess;
  connected: boolean;
}

class MCPClientManager {
  private clients: Map<ChainMode, MCPClient> = new Map();
  private currentMode: ChainMode | null = null;

  async initialize(): Promise<void> {
    await loadMCPConfig();
    console.log('[MCP] Client manager initialized');
  }

  async connect(mode: ChainMode): Promise<MCPClient> {
    const existingClient = this.clients.get(mode);
    if (existingClient?.connected) {
      return existingClient;
    }

    const serverConfig = getServerConfigForChain(mode);
    const client: MCPClient = {
      serverName: serverConfig.name,
      chainMode: mode,
      connected: true,
    };

    this.clients.set(mode, client);
    console.log(`[MCP] Connected to ${mode} server: ${serverConfig.name}`);

    return client;
  }

  async disconnect(mode: ChainMode): Promise<void> {
    const client = this.clients.get(mode);
    if (client) {
      client.connected = false;
      console.log(`[MCP] Disconnected from ${mode} server`);
    }
  }

  setCurrentMode(mode: ChainMode): void {
    this.currentMode = mode;
    console.log(`[MCP] Current mode set to: ${mode}`);
  }

  getCurrentMode(): ChainMode | null {
    return this.currentMode;
  }

  getClient(mode: ChainMode): MCPClient | undefined {
    return this.clients.get(mode);
  }

  getCurrentClient(): MCPClient | undefined {
    if (!this.currentMode) return undefined;
    return this.clients.get(this.currentMode);
  }

  async listTools(mode: ChainMode): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];

    if (mode === 'solana') {
      tools.push(
        {
          name: 'solana_getBalance',
          description: 'Get SOL balance for a wallet address',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Solana wallet address' },
            },
            required: ['address'],
          },
        },
        {
          name: 'solana_requestAirdrop',
          description: 'Request SOL airdrop on devnet/testnet',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Solana wallet address' },
              amount: { type: 'number', description: 'Amount in SOL' },
            },
            required: ['address', 'amount'],
          },
        },
        {
          name: 'solana_getTokenBalance',
          description: 'Get SPL token balance for a wallet',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Solana wallet address' },
              mintAddress: { type: 'string', description: 'SPL token mint address' },
            },
            required: ['address', 'mintAddress'],
          },
        }
      );
    } else if (mode === 'evm') {
      tools.push(
        {
          name: 'evm_getBalance',
          description: 'Get ETH/ERC-20 balance for an address',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Ethereum address' },
              tokenAddress: { type: 'string', description: 'ERC-20 token address (optional)' },
            },
            required: ['address'],
          },
        },
        {
          name: 'evm_callContract',
          description: 'Read from an EVM contract',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Contract address' },
              data: { type: 'string', description: 'Encoded function call data' },
            },
            required: ['to', 'data'],
          },
        },
        {
          name: 'evm_getNetwork',
          description: 'Get current EVM network info',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        }
      );
    }

    return tools;
  }

  async callTool(toolName: string, params: Record<string, unknown>): Promise<MCPToolResult> {
    console.log(`[MCP] Calling tool: ${toolName}`, params);
    
    if (toolName.startsWith('solana_')) {
      return this.handleSolanaTool(toolName, params);
    } else if (toolName.startsWith('evm_')) {
      return this.handleEvmTool(toolName, params);
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }

  private async handleSolanaTool(toolName: string, params: Record<string, unknown>): Promise<MCPToolResult> {
    const config = getServerConfigForChain('solana');
    
    switch (toolName) {
      case 'solana_getBalance': {
        const address = params.address as string;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              method: 'getBalance',
              address,
              rpcUrl: config.env.RPC_URL,
              network: config.env.NETWORK,
              note: 'Connect to solana-mcp server to execute this request',
            }),
          }],
        };
      }
      case 'solana_requestAirdrop': {
        const address = params.address as string;
        const amount = params.amount as number;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              method: 'requestAirdrop',
              address,
              amount,
              rpcUrl: config.env.RPC_URL,
              network: config.env.NETWORK,
              note: 'Connect to solana-mcp server to execute this request',
            }),
          }],
        };
      }
      case 'solana_getTokenBalance': {
        const address = params.address as string;
        const mintAddress = params.mintAddress as string;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              method: 'getTokenBalance',
              address,
              mintAddress,
              rpcUrl: config.env.RPC_URL,
              note: 'Connect to solana-mcp server to execute this request',
            }),
          }],
        };
      }
      default:
        throw new Error(`Unknown Solana tool: ${toolName}`);
    }
  }

  private async handleEvmTool(toolName: string, params: Record<string, unknown>): Promise<MCPToolResult> {
    const config = getServerConfigForChain('evm');
    
    switch (toolName) {
      case 'evm_getBalance': {
        const address = params.address as string;
        const tokenAddress = params.tokenAddress as string | undefined;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              method: 'getBalance',
              address,
              tokenAddress: tokenAddress || null,
              rpcUrl: config.env.RPC_URL,
              chainId: config.env.CHAIN_ID,
              note: 'Connect to evm-mcp-server to execute this request',
            }),
          }],
        };
      }
      case 'evm_callContract': {
        const to = params.to as string;
        const data = params.data as string;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              method: 'callContract',
              to,
              data,
              rpcUrl: config.env.RPC_URL,
              chainId: config.env.CHAIN_ID,
              note: 'Connect to evm-mcp-server to execute this request',
            }),
          }],
        };
      }
      case 'evm_getNetwork': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              method: 'getNetwork',
              rpcUrl: config.env.RPC_URL,
              chainId: config.env.CHAIN_ID,
              note: 'Connect to evm-mcp-server to execute this request',
            }),
          }],
        };
      }
      default:
        throw new Error(`Unknown EVM tool: ${toolName}`);
    }
  }
}

export const mcpClientManager = new MCPClientManager();
