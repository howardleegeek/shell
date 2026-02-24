// Simple in-browser chain store (ES module)
// Holds current chain type (svm|evm) and network, plus helper utilities.

let state = {
  chainType: 'svm', // 'svm' | 'evm' | 'move'
  network: 'Devnet', // default network for SVM; for other chains, default may vary
};

const listeners = new Set();

export function getState() {
  return { ...state };
}

export function getNetworkOptions(chainType) {
  if (chainType === 'svm') {
    return ['Devnet', 'Testnet', 'Mainnet-beta'];
  } else if (chainType === 'evm') {
    return ['Anvil', 'Sepolia', 'Base Sepolia', 'Mainnet'];
  } else if (chainType === 'move') {
    // Move ecosystems for Sui / Aptos
    return ['Sui', 'Aptos'];
  }
  return [];
}

export function setChainType(type) {
  if (type !== 'svm' && type !== 'evm' && type !== 'move') return;
  state.chainType = type;
  // Reset network to a valid default for the selected chain
  const opts = getNetworkOptions(type);
  if (!opts.includes(state.network)) {
    state.network = opts[0];
  }
  notify();
}

export function setNetwork(net) {
  const opts = getNetworkOptions(state.chainType);
  if (opts.includes(net)) {
    state.network = net;
    notify();
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  // Immediately notify new subscriber of current state
  listener({ ...state });
  return () => listeners.delete(listener);
}

function notify() {
  const s = { ...state };
  for (const l of listeners) {
    try {
      l(s);
    } catch (e) {
      // avoid a single listener breaking others
      console.error('chainStore: listener error', e);
    }
  }
}
