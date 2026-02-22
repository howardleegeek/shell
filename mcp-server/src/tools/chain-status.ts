import { z } from 'zod';

export interface ChainStatusResult {
  online: boolean;
  chain_id: number;
  block_number: number;
  accounts: string[];
  gas_price: string;
  rpc_url: string;
  node_type: 'anvil' | 'hardhat' | 'geth' | 'unknown';
}

export interface ChainStatusOptions {
  chain?: 'anvil' | 'hardhat' | 'custom';
  rpc_url?: string;
}

const DEFAULT_RPC_URL = 'http://127.0.0.1:8545';

const RPC_METHODS = {
  eth_blockNumber: 'eth_blockNumber',
  eth_chainId: 'eth_chainId',
  eth_accounts: 'eth_accounts',
  net_version: 'net_version',
  eth_gasPrice: 'eth_gasPrice',
  web3_clientVersion: 'web3_clientVersion',
};

export const chainStatusSchema = z.object({
  chain?: z.enum(['anvil', 'hardhat', 'custom']),
  rpc_url?: z.string().url().optional(),
});

export type ChainStatusArgs = z.infer<typeof chainStatusSchema>;

export async function fetchJsonRpc<T>(url: string, method: string, params: any[] = []): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`JSON-RPC error: ${result.error.message}`);
  }

  return result.result;
}

export function detectNodeType(clientVersion: string): 'anvil' | 'hardhat' | 'geth' | 'unknown' {
  if (clientVersion.includes('Anvil')) {
    return 'anvil';
  }
  if (clientVersion.includes('Hardhat')) {
    return 'hardhat';
  }
  if (clientVersion.includes('Geth')) {
    return 'geth';
  }
  return 'unknown';
}

export async function getChainStatus(args: ChainStatusArgs): Promise<ChainStatusResult> {
  const rpcUrl = args.rpc_url || DEFAULT_RPC_URL;
  
  try {
    // Check if node is online
    const blockNumber = await fetchJsonRpc<string>(rpcUrl, RPC_METHODS.eth_blockNumber);
    const chainId = await fetchJsonRpc<string>(rpcUrl, RPC_METHODS.eth_chainId);
    const accounts = await fetchJsonRpc<string[]>(rpcUrl, RPC_METHODS.eth_accounts);
    const gasPrice = await fetchJsonRpc<string>(rpcUrl, RPC_METHODS.eth_gasPrice);
    const clientVersion = await fetchJsonRpc<string>(rpcUrl, RPC_METHODS.web3_clientVersion);
    
    return {
      online: true,
      chain_id: parseInt(chainId, 16),
      block_number: parseInt(blockNumber, 16),
      accounts,
      gas_price: gasPrice,
      rpc_url,
      node_type: detectNodeType(clientVersion),
    };
  } catch (error) {
    return {
      online: false,
      chain_id: 0,
      block_number: 0,
      accounts: [],
      gas_price: '0',
      rpc_url,
      node_type: 'unknown',
    };
  }
}

export async function chain_status(args: ChainStatusArgs): Promise<ChainStatusResult> {
  return getChainStatus(args);
}