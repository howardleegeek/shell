// Lightweight MCP tool descriptors for the UI/AI chat integration
export type McpTool = {
  id: string;
  label: string;
  description?: string;
  command: string;
};

export const mcpTools: McpTool[] = [
  {
    id: 'solana-balance',
    label: 'Check SOL balance',
    description: 'Query SOL balance via solana-mcp',
    command: 'solana-mcp getBalance',
  },
  {
    id: 'solana-airdrop',
    label: 'Airdrop 2 SOL',
    description: 'Request SOL airdrop via solana-mcp',
    command: 'solana-mcp requestAirdrop',
  },
  {
    id: 'evm-balance',
    label: 'Read USDC balance (ERC-20)',
    description: 'Query token balance via evm-mcp',
    command: 'evm-mcp getBalance',
  }
];
