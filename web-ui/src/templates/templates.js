// CommonJS data module for templates used by Node-based tests
// Data is kept separate from UI to satisfy the acceptance criteria
//  - 5 SVM templates (Solana)
//  - 5 EVM templates (Ethereum)

module.exports = {
  svm: [
    {
      id: 'svm-spl-token',
      title: 'SPL Token',
      emoji: '🪙',
      description: 'Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor\'s #[account] macros for account validation.',
      prompt: 'Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor\'s #[account] macros for account validation.'
    },
    {
      id: 'svm-nft-collection',
      title: 'NFT Collection',
      emoji: '🎨',
      description: 'Solana NFT collection program using Anchor with Metaplex standards. Include mint_nft, update_metadata, and verify_collection instructions.',
      prompt: 'Create a Solana NFT collection program using Anchor with Metaplex standards. Include mint_nft, update_metadata, and verify_collection instructions.'
    },
    {
      id: 'svm-staking',
      title: 'Staking Program',
      emoji: '🪙✨',
      description: 'Solana staking program using Anchor. Stake SOL, earn rewards over time, and unstake. Include time-based reward calculation.',
      prompt: 'Create a Solana staking program using Anchor. Users can stake SOL, earn rewards over time, and unstake. Include reward calculation based on time staked.'
    },
    {
      id: 'svm-escrow',
      title: 'Escrow',
      emoji: '🤝',
      description: 'Solana escrow program. Atomic token swap between two parties with cancel and execute instructions.',
      prompt: 'Create a Solana escrow program using Anchor. Allow two parties to swap tokens atomically with cancel and execute instructions.'
    },
    {
      id: 'svm-dao-voting',
      title: 'DAO Voting',
      emoji: '🗳️',
      description: 'Simple Solana DAO voting program. Members create proposals, vote yes/no, and execute proposals that pass threshold.',
      prompt: 'Create a simple Solana DAO voting program using Anchor. Members can create proposals, vote yes/no, and execute proposals that pass threshold.'
    }
  ],
  evm: [
    {
      id: 'evm-erc20',
      title: 'ERC-20 Token',
      emoji: '🪙',
      description: 'ERC-20 token contract using Solidity 0.8+. Mint (owner), burn, and transfer. OpenZeppelin base. Constructor for name, symbol, initial supply.',
      prompt: 'Create an ERC-20 token contract using Solidity 0.8+. Include mint (owner only), burn, and transfer. Use OpenZeppelin\'s ERC20 base. Add constructor params for name, symbol, and initial supply.'
    },
    {
      id: 'evm-erc721',
      title: 'ERC-721 NFT',
      emoji: '🎟️',
      description: 'ERC-721 NFT contract with OpenZeppelin. Include safeMint with tokenURI, royalties (ERC-2981), and max supply limit.',
      prompt: 'Create an ERC-721 NFT contract using Solidity 0.8+ with OpenZeppelin. Include safeMint with tokenURI, royalties (ERC-2981), and max supply limit.'
    },
    {
      id: 'evm-simple-vault',
      title: 'Simple Vault',
      emoji: '🏦',
      description: 'Solidity vault contract that accepts ETH, tracks balances, and allows withdrawals. Include emergency owner withdrawal. Use ReentrancyGuard.',
      prompt: 'Create a Solidity vault contract that accepts ETH deposits, tracks balances per user, and allows withdrawals. Include emergency withdraw for owner. Use ReentrancyGuard.'
    },
    {
      id: 'evm-dex',
      title: 'DEX (AMM)',
      emoji: '💱',
      description: 'Simple constant-product AMM (x*y=k). Include addLiquidity, removeLiquidity, and swap. Fees 0.3%.',
      prompt: 'Create a simple constant-product AMM (x*y=k) in Solidity. Include addLiquidity, removeLiquidity, and swap functions. Calculate fees at 0.3%.'
    },
    {
      id: 'evm-governance',
      title: 'Governance',
      emoji: '🏛️',
      description: 'Solidity governance contract using OpenZeppelin Governor. Include propose, vote, queue, and execute. Voting period 1 week, quorum 4%.',
      prompt: 'Create a Solidity governance contract using OpenZeppelin Governor. Include propose, vote, queue, and execute. Voting period 1 week, quorum 4%.'
    }
  ]
};
