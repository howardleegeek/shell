import { atom, computed } from "nanostores";

export type ChainType = "svm" | "evm";
export type LocalChainLifecycleStatus =
  | "stopped"
  | "starting"
  | "running"
  | "stopping";

export interface LocalChainRuntimeState {
  status: LocalChainLifecycleStatus;
  chainType: ChainType | null;
  rpcUrl: string | null;
  healthCheckUrl: string | null;
  lastUpdatedAt: number;
}

export const SVM_NETWORKS = ["devnet", "testnet", "mainnet-beta"] as const;
export const EVM_NETWORKS = [
  "anvil",
  "sepolia",
  "base-sepolia",
  "mainnet",
] as const;

const CHAIN_NETWORKS: Record<ChainType, readonly string[]> = {
  svm: SVM_NETWORKS,
  evm: EVM_NETWORKS,
};

export const chainType = atom<ChainType>("svm");
export const network = atom<string>("devnet");
export const localChainRuntime = atom<LocalChainRuntimeState>({
  status: "stopped",
  chainType: null,
  rpcUrl: null,
  healthCheckUrl: null,
  lastUpdatedAt: Date.now(),
});

export const chainStore = computed(
  [chainType, network],
  (type, activeNetwork) => ({
    chainType: type,
    network: activeNetwork,
  }),
);

export const localChainStore = computed(
  [localChainRuntime],
  (runtime) => runtime,
);

export function getNetworksForChain(type: ChainType) {
  return CHAIN_NETWORKS[type];
}

export function setChain(type: ChainType, nextNetwork?: string) {
  const chainNetworks = getNetworksForChain(type);
  const fallbackNetwork = chainNetworks[0];
  const resolvedNetwork =
    nextNetwork && chainNetworks.includes(nextNetwork)
      ? nextNetwork
      : fallbackNetwork;

  chainType.set(type);
  network.set(resolvedNetwork);
}

export function setNetwork(nextNetwork: string) {
  const chainNetworks = getNetworksForChain(chainType.get());
  network.set(
    chainNetworks.includes(nextNetwork) ? nextNetwork : chainNetworks[0],
  );
}

export function setLocalChainRuntime(
  nextState: Partial<LocalChainRuntimeState>,
) {
  localChainRuntime.set({
    ...localChainRuntime.get(),
    ...nextState,
    lastUpdatedAt: Date.now(),
  });
}

export function resetLocalChainRuntime() {
  localChainRuntime.set({
    status: "stopped",
    chainType: null,
    rpcUrl: null,
    healthCheckUrl: null,
    lastUpdatedAt: Date.now(),
  });
}

chainType.listen((nextType, previousType) => {
  if (nextType === previousType) {
    return;
  }

  network.set(getNetworksForChain(nextType)[0]);
});
