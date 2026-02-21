export interface Web3Template {
  name: string;
  label: string;
  description: string;
  icon: string;
  category: 'SVM' | 'EVM';
  prompt: string;
}

export const WEB3_TEMPLATES: Web3Template[] = [
  // SVM (Solana/Anchor) Templates
  {
    name: 'spl-token',
    label: 'SPL Token',
    description: 'Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor\'s #[account] macros for account validation.',
    icon: '💰',
    category: 'SVM',
    prompt: 'Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor\'s #[account] macros for account validation.'
  },
  {
    name: 'nft-collection',
    label: 'NFT Collection',
    description: 'Create a Solana NFT collection program using Anchor with Metaplex standards. Include mint_nft, update_metadata, and verify_collection instructions.',
    icon: '🎨',
    category: 'SVM',
    prompt: 'Create a Solana NFT collection program using Anchor with Metaplex standards. Include mint_nft, update_metadata, and verify_collection instructions.'
  },
  {
    name: 'staking-program',
    label: 'Staking Program',
    description: 'Create a Solana staking program using Anchor. Users can stake SOL, earn rewards over time, and unstake. Include reward calculation based on time staked.',
    icon: '💰',
    category: 'SVM',
    prompt: 'Create a Solana staking program using Anchor. Users can stake SOL, earn rewards over time, and unstake. Include reward calculation based on time staked.'
  },
  {
    name: 'escrow',
    label: 'Escrow',
    description: 'Create a Solana escrow program using Anchor. Allow two parties to swap tokens atomically with cancel and execute instructions.',
    icon: '🔒',
    category: 'SVM',
    prompt: 'Create a Solana escrow program using Anchor. Allow two parties to swap tokens atomically with cancel and execute instructions.'
  },
  {
    name: 'dao-voting',
    label: 'DAO Voting',
    description: 'Create a simple Solana DAO voting program using Anchor. Members can create proposals, vote yes/no, and execute proposals that pass threshold.',
    icon: '👥',
    category: 'SVM',
    prompt: 'Create a simple Solana DAO voting program using Anchor. Members can create proposals, vote yes/no, and execute proposals that pass threshold.'
  },

  // EVM (Solidity/Foundry) Templates
  {
    name: 'erc20-token',
    label: 'ERC-20 Token',
    description: 'Create an ERC-20 token contract using Solidity 0.8+. Include mint (owner only), burn, and transfer. Use OpenZeppelin\'s ERC20 base. Add constructor params for name, symbol, and initial supply.',
    icon: '💰',
    category: 'EVM',
    prompt: 'Create an ERC-20 token contract using Solidity 0.8+. Include mint (owner only), burn, and transfer. Use OpenZeppelin\'s ERC20 base. Add constructor params for name, symbol, and initial supply.'
  },
  {
    name: 'erc721-nft',
    label: 'ERC-721 NFT',
    description: 'Create an ERC-721 NFT contract using Solidity 0.8+ with OpenZeppelin. Include safeMint with tokenURI, royalties (ERC-2981), and max supply limit.',
    icon: '🎨',
    category: 'EVM',
    prompt: 'Create an ERC-721 NFT contract using Solidity 0.8+ with OpenZeppelin. Include safeMint with tokenURI, royalties (ERC-2981), and max supply limit.'
  },
  {
    name: 'simple-vault',
    label: 'Simple Vault',
    description: 'Create a Solidity vault contract that accepts ETH deposits, tracks balances per user, and allows withdrawals. Include emergency withdraw for owner. Use ReentrancyGuard.',
    icon: '🔒',
    category: 'EVM',
    prompt: 'Create a Solidity vault contract that accepts ETH deposits, tracks balances per user, and allows withdrawals. Include emergency withdraw for owner. Use ReentrancyGuard.'
  },
  {
    name: 'dex-amm',
    label: 'DEX (AMM)',
    description: 'Create a simple constant-product AMM (x*y=k) in Solidity. Include addLiquidity, removeLiquidity, and swap functions. Calculate fees at 0.3%.',
    icon: '🚀',
    category: 'EVM',
    prompt: 'Create a simple constant-product AMM (x*y=k) in Solidity. Include addLiquidity, removeLiquidity, and swap functions. Calculate fees at 0.3%.'
  },
  {
    name: 'governance',
    label: 'Governance',
    description: 'Create a Solidity governance contract using OpenZeppelin Governor. Include propose, vote, queue, and execute. Voting period 1 week, quorum 4%.',
    icon: '👥',
    category: 'EVM',
    prompt: 'Create a Solidity governance contract using OpenZeppelin Governor. Include propose, vote, queue, and execute. Voting period 1 week, quorum 4%.'
  }
];

export const WEB3_TEMPLATES_CATEGORIES = [
  { name: 'SVM', label: 'SVM (Solana/Anchor)', description: 'Solana blockchain templates using Anchor framework' },
  { name: 'EVM', label: 'EVM (Solidity/Foundry)', description: 'Ethereum Virtual Machine templates using Solidity and Foundry' }
] as const;

export const WEB3_TAB_LABELS = {
  SVM: 'SVM',
  EVM: 'EVM'
} as const;

export const WEB3_TEMPLATE_ICONS = {
  'SPL Token': '💰',
  'NFT Collection': '🎨',
  'Staking Program': '💰',
  'Escrow': '🔒',
  'DAO Voting': '👥',
  'ERC-20 Token': '💰',
  'ERC-721 NFT': '🎨',
  'Simple Vault': '🔒',
  'DEX (AMM)': '🚀',
  'Governance': '👥'
} as const;