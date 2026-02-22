export type Template = {
  id: string
  title: string
  emoji: string
  description: string
  prompt: string
}

export const SVM_TEMPLATES: Template[] = [
  {
    id: 'svm-spl-token',
    title: 'SPL Token',
    emoji: '🪙',
    description: 'Solana SPL token program using Anchor',
    prompt:
      "Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor's #[account] macros for account validation.",
  },
  {
    id: 'svm-nft-collection',
    title: 'NFT Collection',
    emoji: '🎨',
    description: 'Solana NFT collection program using Anchor with Metaplex',
    prompt:
      'Create a Solana NFT collection program using Anchor with Metaplex standards. Include mint_nft, update_metadata, and verify_collection instructions.',
  },
  {
    id: 'svm-staking',
    title: 'Staking Program',
    emoji: '🧭',
    description: 'Solana staking program with rewards',
    prompt:
      'Create a Solana staking program using Anchor. Users can stake SOL, earn rewards over time, and unstake. Include reward calculation based on time staked.',
  },
  {
    id: 'svm-escrow',
    title: 'Escrow',
    emoji: '🤝',
    description: 'Solana escrow program',
    prompt:
      'Create a Solana escrow program using Anchor. Allow two parties to swap tokens atomically with cancel and execute instructions.',
  },
  {
    id: 'svm-dao-voting',
    title: 'DAO Voting',
    emoji: '🗳️',
    description: 'Solana DAO voting program',
    prompt:
      'Create a simple Solana DAO voting program using Anchor. Members can create proposals, vote yes/no, and execute proposals that pass threshold.',
  },
]

export const EVM_TEMPLATES: Template[] = [
  {
    id: 'evm-erc20',
    title: 'ERC-20 Token',
    emoji: '💠',
    description: 'ERC-20 token with OpenZeppelin',
    prompt:
      'Create an ERC-20 token contract using Solidity 0.8+. Include mint (owner only), burn, and transfer. Use OpenZeppelin\'s ERC20 base. Add constructor params for name, symbol, and initial supply.',
  },
  {
    id: 'evm-erc721',
    title: 'ERC-721 NFT',
    emoji: '🎭',
    description: 'ERC-721 NFT with royalties',
    prompt:
      'Create an ERC-721 NFT contract using Solidity 0.8+ with OpenZeppelin. Include safeMint with tokenURI, royalties (ERC-2981), and max supply limit.',
  },
  {
    id: 'evm-vault',
    title: 'Simple Vault',
    emoji: '🏦',
    description: 'Solidity vault with deposits/withdrawals',
    prompt:
      'Create a Solidity vault contract that accepts ETH deposits, tracks balances per user, and allows withdrawals. Include emergency withdraw for owner. Use ReentrancyGuard.',
  },
  {
    id: 'evm-amm',
    title: 'DEX (AMM)',
    emoji: '🧭',
    description: 'Simple constant-product AMM',
    prompt:
      'Create a simple constant-product AMM (x*y=k) in Solidity. Include addLiquidity, removeLiquidity, and swap functions. Calculate fees at 0.3%.',
  },
  {
    id: 'evm-governance',
    title: 'Governance',
    emoji: '🏛️',
    description: 'Governor pattern',
    prompt:
      'Create a Solidity governance contract using OpenZeppelin Governor. Include propose, vote, queue, and execute. Voting period 1 week, quorum 4%.',
  },
]
