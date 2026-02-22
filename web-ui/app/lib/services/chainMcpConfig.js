const SVM_RPC_URLS = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};

const EVM_DEFAULT_NETWORKS = {
  anvil: 'anvil',
  sepolia: 'sepolia',
  'base-sepolia': 'base-sepolia',
  mainnet: 'mainnet',
};

function buildSolanaConfig(network) {
  const cluster = SVM_RPC_URLS[network] ? network : 'devnet';
  const rpcUrl = SVM_RPC_URLS[cluster];

  return {
    mcpServers: {
      'solana-mcp': {
        type: 'stdio',
        command: 'npx',
        args: ['-y', 'solana-mcp'],
        env: {
          SOLANA_CLUSTER: cluster,
          SOLANA_RPC_URL: rpcUrl,
        },
      },
    },
  };
}

function buildEvmConfig(network) {
  const resolvedNetwork = EVM_DEFAULT_NETWORKS[network] || 'sepolia';

  return {
    mcpServers: {
      'evm-mcp-server': {
        type: 'stdio',
        command: 'npx',
        args: ['-y', 'evm-mcp-server'],
        env: {
          EVM_DEFAULT_NETWORK: resolvedNetwork,
        },
      },
    },
  };
}

export function getMcpServerNameForChain(chainType) {
  return chainType === 'svm' ? 'solana-mcp' : 'evm-mcp-server';
}

export function buildChainMcpConfig(chainType, network) {
  if (chainType === 'svm') {
    return buildSolanaConfig(network);
  }

  return buildEvmConfig(network);
}
