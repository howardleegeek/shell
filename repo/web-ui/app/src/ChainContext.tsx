import React, { createContext, useContext, useMemo, useState } from 'react';

type ChainType = 'svm' | 'evm';

type ChainContextValue = {
  chainType: ChainType;
  network: string;
  setChainType: (t: ChainType) => void;
  setNetwork: (n: string) => void;
  availableNetworks: string[];
};

const ChainContext = createContext<ChainContextValue | undefined>(undefined);

export const useChain = (): ChainContextValue => {
  const c = useContext(ChainContext);
  if (!c) throw new Error('useChain must be used within ChainProvider');
  return c;
};

export const ChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chainType, setChainType] = useState<ChainType>('svm');
  const [network, setNetwork] = useState<string>('Devnet');

  const svmNetworks = useMemo(() => ['Devnet', 'Testnet', 'Mainnet-beta'], []);
  const evmNetworks = useMemo(() => ['Anvil', 'Sepolia', 'Base Sepolia', 'Mainnet'], []);

  const availableNetworks = chainType === 'svm' ? svmNetworks : evmNetworks;

  const value = useMemo(
    () => ({ chainType, network, setChainType, setNetwork, availableNetworks }),
    [chainType, network, availableNetworks]
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
};
