// CommonJS shim for Node-based tests
/*
  Exposed API (Node):
  - getState(): { chainType, network }
  - setChainType(type): void
  - setNetwork(net): void
  - subscribe(cb): () => void
  - getNetworkOptions(type): string[]
*/
(function(){
  const state = {
    chainType: 'svm',
    network: 'Devnet'
  };

  function getNetworkOptions(type){
    if (type === 'svm') return ['Devnet','Testnet','Mainnet-beta'];
    if (type === 'evm') return ['Anvil','Sepolia','Base Sepolia','Mainnet'];
    if (type === 'move') return ['Sui','Aptos'];
    return [];
  }

  function getState(){ return { ...state }; }
  function setChainType(type){ if (type==='svm' || type==='evm' || type==='move') {
      state.chainType = type;
      const opts = getNetworkOptions(type);
      if (!opts.includes(state.network)) state.network = opts[0];
    } }
  function setNetwork(net){ const opts = getNetworkOptions(state.chainType); if (opts.includes(net)) state.network = net; }

  module.exports = { getState, setChainType, setNetwork, subscribe(cb){ cb(getState()); return function(){}; }, getNetworkOptions };
})();
