// Lightweight templates registry for the Web UI
// Exposed as a JS module for the runtime build script.
module.exports = {
  svmTemplates: [
    {
      id: 'svm-spl-token',
      name: 'SPL Token',
      icon: '🪙',
      description: 'Solana SPL token program using Anchor with mint/transfer/burn. Includes account validation via #[account].',
      prompt: 'Create a Solana SPL token program using Anchor. Include mint, transfer, and burn instructions. Use Anchor's #[account] macros for account validation.'
    },
    {
      id: 'svm-nft-collection',
      name: 'NFT Collection',
      icon: '🎨',
      description: 'Solana NFT collection using Anchor with Metaplex standards. Include mint_nft, update_metadata, verify_collection.',
      prompt: 'Create a Solana NFT collection program using Anchor with Metaplex standards. Include mint_nft, update_metadata, and verify_collection instructions.'
    },
    {
      id: 'svm-staking',
      name: 'Staking Program',
      icon: '🪙✨',
      description: 'Staking SOL with time-based rewards. Include stake, claim rewards, and unstake.',
      prompt: 'Create a Solana staking program using Anchor. Users can stake SOL, earn rewards over time, and unstake. Include reward calculation based on time staked.'
    },
    {
      id: 'svm-escrow',
      name: 'Escrow',
      icon: '🤝',
      description: 'Two-party escrow for token swaps with cancel and execute instructions.',
      prompt: 'Create a Solana escrow program using Anchor. Allow two parties to swap tokens atomically with cancel and execute instructions.'
    },
    {
      id: 'svm-dao-voting',
      name: 'DAO Voting',
      icon: '🗳️',
      description: 'Simple DAO voting with proposals, yes/no votes, and execute when threshold met.',
      prompt: 'Create a simple Solana DAO voting program using Anchor. Members can create proposals, vote yes/no, and execute proposals that pass threshold.'
    }
  ],
  evmTemplates: [
    {
      id: 'evm-erc20',
      name: 'ERC-20 Token',
      icon: '💠',
      description: 'ERC-20 token with OpenZeppelin, mint (owner), burn, transfer; constructor for name, symbol, initial supply.',
      prompt: 'Create an ERC-20 token contract using Solidity 0.8+. Include mint (owner only), burn, and transfer. Use OpenZeppelin\'s ERC20 base. Add constructor params for name, symbol, and initial supply.'
    },
    {
      id: 'evm-erc721',
      name: 'ERC-721 NFT',
      icon: '🧩',
      description: 'ERC-721 with OpenZeppelin; safeMint with tokenURI, royalties (ERC-2981), max supply.',
      prompt: 'Create an ERC-721 NFT contract using Solidity 0.8+ with OpenZeppelin. Include safeMint with tokenURI, royalties (ERC-2981), and max supply limit.'
    },
    {
      id: 'evm-vault',
      name: 'Simple Vault',
      icon: '🏦',
      description: 'Solidity vault that accepts ETH, tracks balances, allows withdrawals; emergency owner withdrawal; ReentrancyGuard.',
      prompt: 'Create a Solidity vault contract that accepts ETH deposits, tracks balances per user, and allows withdrawals. Include emergency withdraw for owner. Use ReentrancyGuard.'
    },
    {
      id: 'evm-dex',
      name: 'DEX (AMM)',
      icon: '🧭',
      description: 'Simple constant-product AMM (x*y=k) with addLiquidity, removeLiquidity, swap; 0.3% fee.',
      prompt: 'Create a simple constant-product AMM (x*y=k) in Solidity. Include addLiquidity, removeLiquidity, and swap functions. Calculate fees at 0.3%.'
    },
    {
      id: 'evm-governance',
      name: 'Governance',
      icon: '⚖️',
      description: 'Governor pattern with propose, vote, queue, execute; voting period 1 week, quorum 4%.',
      prompt: 'Create a Solidity governance contract using OpenZeppelin Governor. Include propose, vote, queue, and execute. Voting period 1 week, quorum 4%.'
    }
  ]
};
