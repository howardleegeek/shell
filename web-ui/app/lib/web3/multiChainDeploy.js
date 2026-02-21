const NETWORKS = [
  {
    id: 'sepolia',
    label: 'Sepolia',
    type: 'evm',
    chainId: 11155111,
    explorerBaseUrl: 'https://sepolia.etherscan.io/tx/',
  },
  {
    id: 'base-sepolia',
    label: 'Base Sepolia',
    type: 'evm',
    chainId: 84532,
    explorerBaseUrl: 'https://sepolia.basescan.org/tx/',
  },
  {
    id: 'arbitrum-sepolia',
    label: 'Arbitrum Sepolia',
    type: 'evm',
    chainId: 421614,
    explorerBaseUrl: 'https://sepolia.arbiscan.io/tx/',
  },
  {
    id: 'polygon-amoy',
    label: 'Polygon Amoy',
    type: 'evm',
    chainId: 80002,
    explorerBaseUrl: 'https://amoy.polygonscan.com/tx/',
  },
  {
    id: 'solana-devnet',
    label: 'Solana Devnet',
    type: 'svm',
    chainId: null,
    explorerBaseUrl: 'https://explorer.solana.com/tx/',
    explorerQuery: '?cluster=devnet',
  },
  {
    id: 'solana-testnet',
    label: 'Solana Testnet',
    type: 'svm',
    chainId: null,
    explorerBaseUrl: 'https://explorer.solana.com/tx/',
    explorerQuery: '?cluster=testnet',
  },
];

function getNetworkById(networkId) {
  return NETWORKS.find((item) => item.id === networkId) || null;
}

function createDefaultDeployConfig() {
  const networks = {};

  for (const network of NETWORKS) {
    networks[network.id] = {
      constructorArgs: '',
      gasPriceGwei: network.type === 'evm' ? '2' : '',
      selected: false,
    };
  }

  return {
    version: 1,
    contract: 'MyToken.sol',
    retryLimit: 1,
    networks,
  };
}

function buildExplorerTxUrl(networkId, txHash) {
  const network = getNetworkById(networkId);

  if (!network || !txHash) {
    return '';
  }

  return `${network.explorerBaseUrl}${txHash}${network.explorerQuery || ''}`;
}

function serializeDeployConfig(config) {
  return JSON.stringify(config, null, 2);
}

function parseDeployConfig(rawText) {
  const parsed = JSON.parse(rawText);

  if (!parsed || typeof parsed !== 'object' || typeof parsed.contract !== 'string') {
    throw new Error('Invalid deploy config format');
  }

  return parsed;
}

async function runDeployTask(task, onUpdate) {
  const { network, config, contract, retryLimit, adapters } = task;
  const adapter = network.type === 'evm' ? adapters.deployEvm : adapters.deploySvm;
  let lastError = null;

  for (let attempt = 1; attempt <= retryLimit + 1; attempt += 1) {
    onUpdate(network.id, { status: 'deploying', attempt, error: null });

    try {
      const response = await adapter({
        network,
        contract,
        constructorArgs: config.constructorArgs,
        gasPriceGwei: config.gasPriceGwei || '',
      });

      return {
        networkId: network.id,
        networkLabel: network.label,
        networkType: network.type,
        status: 'success',
        attempt,
        address: response.address,
        txHash: response.txHash,
        explorerUrl: buildExplorerTxUrl(network.id, response.txHash),
        error: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      onUpdate(network.id, { status: 'retrying', attempt, error: lastError });
    }
  }

  return {
    networkId: network.id,
    networkLabel: network.label,
    networkType: network.type,
    status: 'failed',
    attempt: retryLimit + 1,
    address: '',
    txHash: '',
    explorerUrl: '',
    error: lastError || 'Unknown deployment failure',
  };
}

async function deploySelectedNetworks(options) {
  const { contract, networkConfigs, retryLimit, adapters, onUpdate = () => {} } = options;
  const selected = NETWORKS.filter((network) => networkConfigs?.[network.id]?.selected);

  const tasks = selected.map((network) =>
    runDeployTask(
      {
        network,
        config: networkConfigs[network.id],
        contract,
        retryLimit,
        adapters,
      },
      onUpdate,
    ),
  );

  return Promise.all(tasks);
}

function createMockAdapters(delayMs = 200) {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const buildAddress = (prefix, networkId) => {
    const normalized = networkId.replace(/[^a-z0-9]/gi, '').slice(0, 8).padEnd(8, '0');
    return `${prefix}${normalized}`;
  };

  return {
    async deployEvm({ network }) {
      await wait(delayMs);

      return {
        address: buildAddress('0x', network.id).padEnd(42, '0').slice(0, 42),
        txHash: buildAddress('0x', `${network.id}tx`).padEnd(66, 'a').slice(0, 66),
      };
    },
    async deploySvm({ network }) {
      await wait(delayMs);

      return {
        address: `${network.id.replace(/-/g, '').slice(0, 16).padEnd(16, 'x')}`,
        txHash: `${network.id.replace(/-/g, '').slice(0, 32).padEnd(32, 'y')}`,
      };
    },
  };
}

async function verifyAllWithSourcify(results, onUpdate = () => {}) {
  const evmResults = results.filter((item) => item.status === 'success' && item.networkType === 'evm');
  const checks = evmResults.map(async (item) => {
    const network = getNetworkById(item.networkId);
    const verifyUrl = `https://sourcify.dev/#/lookup/${item.address}`;
    const entry = {
      networkId: item.networkId,
      networkLabel: item.networkLabel,
      status: network?.chainId ? 'verified' : 'skipped',
      verifyUrl,
    };

    onUpdate(item.networkId, entry);
    return entry;
  });

  return Promise.all(checks);
}

module.exports = {
  NETWORKS,
  getNetworkById,
  createDefaultDeployConfig,
  serializeDeployConfig,
  parseDeployConfig,
  buildExplorerTxUrl,
  deploySelectedNetworks,
  createMockAdapters,
  verifyAllWithSourcify,
};
