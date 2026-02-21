import { useStore } from '@nanostores/react';
import {
  chainType,
  EVM_NETWORKS,
  network,
  setNetwork,
  SVM_NETWORKS,
} from '~/lib/stores/chain';

export function NetworkSelector() {
  const activeChainType = useStore(chainType);
  const activeNetwork = useStore(network);
  const networks = activeChainType === 'svm' ? SVM_NETWORKS : EVM_NETWORKS;

  return (
    <div className="relative">
      <label htmlFor="chain-network-selector" className="sr-only">
        Select network
      </label>
      <select
        id="chain-network-selector"
        value={activeNetwork}
        onChange={(event) => setNetwork(event.target.value)}
        className="h-9 min-w-[156px] appearance-none rounded-xl border border-[#b84dff]/65 bg-[#0a0a0f] pl-3 pr-8 text-xs font-semibold uppercase tracking-wide text-[#00ff88] outline-none transition-all hover:border-[#00ff88]/70 focus:border-[#00ff88]"
        style={{
          boxShadow:
            '0 0 14px rgba(184, 77, 255, 0.28), inset 0 0 8px rgba(184, 77, 255, 0.12)',
        }}
      >
        {networks.map((networkName) => (
          <option key={networkName} value={networkName}>
            {networkName}
          </option>
        ))}
      </select>
      <span className="i-ph:caret-down pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#00ff88]" />
    </div>
  );
}
