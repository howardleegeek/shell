import { Plugin, InstalledPlugin, PluginCategory, PluginState } from './types';

const STORAGE_KEY = 'shell-vibe-plugins';

const BUILTIN_PLUGINS: Plugin[] = [
  {
    id: 'slither',
    name: 'Slither Audit',
    version: '0.2.1',
    author: 'Trail of Bits',
    description: 'Automatic security scanning for Solidity smart contracts. Detects common vulnerabilities and provides detailed reports.',
    npmPackage: 'shell-plugin-slither',
    downloads: 1240,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche'],
    category: 'Analysis',
    rating: { average: 4.8, count: 156 },
  },
  {
    id: 'mythril',
    name: 'Mythril Security',
    version: '0.3.0',
    author: 'ConsenSys',
    description: 'Symbolic execution tool for security analysis of Ethereum smart contracts.',
    npmPackage: 'shell-plugin-mythril',
    downloads: 890,
    chainSupport: ['ethereum', 'polygon', 'bsc'],
    category: 'Analysis',
    rating: { average: 4.6, count: 98 },
  },
  {
    id: 'otterscan',
    name: 'Otterscan Explorer',
    version: '1.0.0',
    author: 'Oyster Labs',
    description: 'Local block explorer panel for debugging. Browse transactions, blocks, and contracts locally.',
    npmPackage: 'shell-plugin-otterscan',
    downloads: 800,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'],
    category: 'Tools',
    rating: { average: 4.5, count: 234 },
  },
  {
    id: 'whatsabi',
    name: 'WhatsABI',
    version: '0.1.5',
    author: 'Hashing Systems',
    description: 'Automatic ABI inference from on-chain contracts. Easily interact with any verified contract.',
    npmPackage: 'shell-plugin-whatsabi',
    downloads: 620,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'],
    category: 'Tools',
    rating: { average: 4.7, count: 87 },
  },
  {
    id: 'hardhat-deploy',
    name: 'Hardhat Deploy',
    version: '0.12.0',
    author: 'Hardhat',
    description: 'Advanced deployment functionality with deterministic deployment and diamond standard support.',
    npmPackage: 'shell-plugin-hardhat-deploy',
    downloads: 2100,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'],
    category: 'Deploy',
    rating: { average: 4.9, count: 312 },
  },
  {
    id: 'foundry',
    name: 'Foundry Toolkit',
    version: '0.2.0',
    author: 'Paradigm',
    description: 'Integration with Foundry/Forge for fast testing and scripting.',
    npmPackage: 'shell-plugin-foundry',
    downloads: 1750,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'],
    category: 'Tools',
    rating: { average: 4.8, count: 198 },
  },
  {
    id: ' Tenderly',
    name: 'Tenderly Debugger',
    version: '1.0.0',
    author: 'Tenderly',
    description: 'Simulation and debugging platform integration. Debug transactions with full stack traces.',
    npmPackage: 'shell-plugin-tenderly',
    downloads: 540,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'],
    category: 'Analysis',
    rating: { average: 4.4, count: 67 },
  },
  {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    author: 'OpenZeppelin',
    description: 'Secure smart contract library with battle-tested implementations of ERC standards.',
    npmPackage: 'shell-plugin-openzeppelin',
    downloads: 3200,
    chainSupport: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'],
    category: 'Tools',
    rating: { average: 5.0, count: 456 },
  },
  {
    id: 'chainlink',
    name: 'Chainlink Price Feeds',
    version: '0.4.0',
    author: 'Chainlink',
    description: 'Integration with Chainlink oracle networks for reliable price data.',
    npmPackage: 'shell-plugin-chainlink',
    downloads: 680,
    chainSupport: ['ethereum', 'polygon', 'avalanche'],
    category: 'Chain-specific',
    rating: { average: 4.3, count: 89 },
  },
  {
    id: 'uniswap',
    name: 'Uniswap SDK',
    version: '3.0.0',
    author: 'Uniswap',
    description: 'Integration with Uniswap for DEX interactions, token swaps, and liquidity management.',
    npmPackage: 'shell-plugin-uniswap',
    downloads: 920,
    chainSupport: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    category: 'DeFi',
    rating: { average: 4.6, count: 134 },
  },
];

function loadState(): PluginState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load plugin state:', e);
  }
  return {
    availablePlugins: BUILTIN_PLUGINS,
    installedPlugins: [],
    userRatings: {},
  };
}

function saveState(state: PluginState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save plugin state:', e);
  }
}

let currentState = loadState();

export function getPluginState(): PluginState {
  return currentState;
}

export function getAvailablePlugins(): Plugin[] {
  return currentState.availablePlugins;
}

export function getInstalledPlugins(): InstalledPlugin[] {
  return currentState.installedPlugins;
}

export function getPluginById(id: string): Plugin | undefined {
  return currentState.availablePlugins.find(p => p.id === id);
}

export function isPluginInstalled(pluginId: string): boolean {
  return currentState.installedPlugins.some(p => p.pluginId === pluginId);
}

export function installPlugin(pluginId: string): boolean {
  const plugin = getPluginById(pluginId);
  if (!plugin || isPluginInstalled(pluginId)) {
    return false;
  }

  const installedPlugin: InstalledPlugin = {
    pluginId,
    installedAt: new Date().toISOString(),
    version: plugin.version,
    enabled: true,
  };

  currentState.installedPlugins.push(installedPlugin);
  
  const pluginIndex = currentState.availablePlugins.findIndex(p => p.id === pluginId);
  if (pluginIndex !== -1) {
    currentState.availablePlugins[pluginIndex] = {
      ...currentState.availablePlugins[pluginIndex],
State.availablePlugins[pluginIndex].download      downloads: currents + 1,
    };
  }

  saveState(currentState);
  return true;
}

export function uninstallPlugin(pluginId: string): boolean {
  if (!isPluginInstalled(pluginId)) {
    return false;
  }

  currentState.installedPlugins = currentState.installedPlugins.filter(
    p => p.pluginId !== pluginId
  );

  saveState(currentState);
  return true;
}

export function togglePluginEnabled(pluginId: string): boolean {
  const installed = currentState.installedPlugins.find(p => p.pluginId === pluginId);
  if (!installed) {
    return false;
  }

  installed.enabled = !installed.enabled;
  saveState(currentState);
  return true;
}

export function ratePlugin(pluginId: string, rating: number): boolean {
  const plugin = getPluginById(pluginId);
  if (!plugin || rating < 1 || rating > 5) {
    return false;
  }

  currentState.userRatings[pluginId] = rating;
  
  const newCount = plugin.rating.count + 1;
  const newAverage = (plugin.rating.average * plugin.rating.count + rating) / newCount;
  
  const pluginIndex = currentState.availablePlugins.findIndex(p => p.id === pluginId);
  if (pluginIndex !== -1) {
    currentState.availablePlugins[pluginIndex] = {
      ...currentState.availablePlugins[pluginIndex],
      rating: {
        average: Math.round(newAverage * 10) / 10,
        count: newCount,
      },
    };
  }

  saveState(currentState);
  return true;
}

export function getUserRating(pluginId: string): number | undefined {
  return currentState.userRatings[pluginId];
}

export function searchPlugins(query: string, category?: PluginCategory): Plugin[] {
  let plugins = currentState.availablePlugins;

  if (category) {
    plugins = plugins.filter(p => p.category === category);
  }

  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    plugins = plugins.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.author.toLowerCase().includes(lowerQuery) ||
      p.npmPackage.toLowerCase().includes(lowerQuery)
    );
  }

  return plugins;
}

export function sortPlugins(plugins: Plugin[], sortBy: 'popular' | 'recent' | 'rating'): Plugin[] {
  const sorted = [...plugins];
  
  switch (sortBy) {
    case 'popular':
      return sorted.sort((a, b) => b.downloads - a.downloads);
    case 'rating':
      return sorted.sort((a, b) => b.rating.average - a.rating.average);
    case 'recent':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.version.split('.').join('')).getTime();
        const dateB = new Date(b.version.split('.').join('')).getTime();
        return dateB - dateA;
      });
    default:
      return sorted;
  }
}

export function filterByChain(plugins: Plugin[], chain: string): Plugin[] {
  return plugins.filter(p => p.chainSupport.includes(chain));
}
