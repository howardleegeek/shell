import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  NETWORKS,
  createDefaultDeployConfig,
  createMockAdapters,
  deploySelectedNetworks,
  parseDeployConfig,
  serializeDeployConfig,
  verifyAllWithSourcify,
} from '~/lib/web3/multiChainDeploy';

type DeployResult = {
  networkId: string;
  networkLabel: string;
  networkType: 'evm' | 'svm';
  status: 'success' | 'failed';
  attempt: number;
  address: string;
  txHash: string;
  explorerUrl: string;
  error: string | null;
};

type VerifyResult = {
  networkId: string;
  networkLabel: string;
  status: 'verified' | 'skipped';
  verifyUrl: string;
};

const adapters = createMockAdapters(250);

type DeployConfig = {
  version: number;
  contract: string;
  retryLimit: number;
  networks: Record<string, { constructorArgs: string; gasPriceGwei: string; selected: boolean }>;
};

export function MultiChainDeployPanel() {
  const [config, setConfig] = useState<DeployConfig>(createDefaultDeployConfig);
  const [networkState, setNetworkState] = useState<Record<string, { status: string; attempt: number; error: string | null }>>({});
  const [results, setResults] = useState<DeployResult[]>([]);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCount = useMemo(
    () => NETWORKS.filter((network) => config.networks?.[network.id]?.selected).length,
    [config.networks],
  );

  const toggleNetwork = (networkId: string) => {
    setConfig((prev) => ({
      ...prev,
      networks: {
        ...prev.networks,
        [networkId]: {
          ...prev.networks[networkId],
          selected: !prev.networks[networkId].selected,
        },
      },
    }));
  };

  const updateNetworkConfig = (networkId: string, key: 'constructorArgs' | 'gasPriceGwei', value: string) => {
    setConfig((prev) => ({
      ...prev,
      networks: {
        ...prev.networks,
        [networkId]: {
          ...prev.networks[networkId],
          [key]: value,
        },
      },
    }));
  };

  const handleDeployAll = async () => {
    if (selectedCount === 0) {
      return;
    }

    setIsDeploying(true);
    setVerifyResults({});
    setResults([]);
    setNetworkState({});

    try {
      const deployed = await deploySelectedNetworks({
        contract: config.contract,
        networkConfigs: config.networks,
        retryLimit: Number(config.retryLimit) || 0,
        adapters,
        onUpdate: (networkId: string, next: { status: string; attempt: number; error: string | null }) => {
          setNetworkState((prev) => ({ ...prev, [networkId]: next }));
        },
      });

      setResults(deployed as DeployResult[]);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleVerifyAll = async () => {
    if (results.length === 0) {
      return;
    }

    setIsVerifying(true);

    try {
      const verified = await verifyAllWithSourcify(results, (networkId: string, next: VerifyResult) => {
        setVerifyResults((prev) => ({ ...prev, [networkId]: next }));
      });
      const map = Object.fromEntries(verified.map((item) => [item.networkId, item]));
      setVerifyResults(map);
    } finally {
      setIsVerifying(false);
    }
  };

  const exportConfig = () => {
    const blob = new Blob([serializeDeployConfig(config)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'deploy.config.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = parseDeployConfig(text);
    setConfig({
      ...createDefaultDeployConfig(),
      ...parsed,
      networks: {
        ...createDefaultDeployConfig().networks,
        ...parsed.networks,
      },
    });
    event.target.value = '';
  };

  return (
    <div className="border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 px-3 py-2" data-testid="multi-chain-deploy-panel">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-bolt-elements-textSecondary">Multi-Chain Deploy</div>
        <div className="text-[11px] text-bolt-elements-textTertiary">{selectedCount} selected</div>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <label className="text-xs text-bolt-elements-textSecondary">
          Contract
          <input
            value={config.contract}
            onChange={(event) => setConfig((prev) => ({ ...prev, contract: event.target.value }))}
            className="mt-1 w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-2 py-1 text-xs"
          />
        </label>

        <label className="text-xs text-bolt-elements-textSecondary">
          Retry Limit
          <input
            value={config.retryLimit}
            onChange={(event) => setConfig((prev) => ({ ...prev, retryLimit: Number(event.target.value || 0) }))}
            type="number"
            min={0}
            max={5}
            className="mt-1 w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-2 py-1 text-xs"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-2 py-1 text-xs"
            onClick={exportConfig}
          >
            Save Config
          </button>
          <button
            className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-2 py-1 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            Load Config
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importConfig} />
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {NETWORKS.map((network) => {
          const state = networkState[network.id];
          const result = results.find((item) => item.networkId === network.id);

          return (
            <div key={network.id} className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-2 py-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.networks[network.id]?.selected || false}
                    onChange={() => toggleNetwork(network.id)}
                  />
                  <span>{network.label}</span>
                  <span className="rounded border border-bolt-elements-borderColor px-1 py-0.5 text-[10px] uppercase text-bolt-elements-textTertiary">
                    {network.type}
                  </span>
                </label>
                <div className="text-[11px] text-bolt-elements-textTertiary">
                  {state?.status === 'deploying' && 'Deploying...'}
                  {state?.status === 'retrying' && `Retrying (${state.attempt})`}
                  {result?.status === 'success' && 'Deployed'}
                  {result?.status === 'failed' && 'Failed'}
                </div>
              </div>

              {config.networks[network.id]?.selected && (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input
                    value={config.networks[network.id]?.constructorArgs || ''}
                    onChange={(event) => updateNetworkConfig(network.id, 'constructorArgs', event.target.value)}
                    placeholder="constructor args (comma separated)"
                    className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
                  />
                  <input
                    value={config.networks[network.id]?.gasPriceGwei || ''}
                    onChange={(event) => updateNetworkConfig(network.id, 'gasPriceGwei', event.target.value)}
                    disabled={network.type !== 'evm'}
                    placeholder={network.type === 'evm' ? 'gas price (gwei)' : 'N/A for SVM'}
                    className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs disabled:opacity-50"
                  />
                </div>
              )}

              {state?.error && <div className="mt-1 text-[11px] text-red-400">{state.error}</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          className="rounded bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          onClick={handleDeployAll}
          disabled={isDeploying || selectedCount === 0}
        >
          {isDeploying ? 'Deploying...' : 'Deploy All'}
        </button>
        <button
          className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-1.5 text-xs disabled:opacity-50"
          onClick={handleVerifyAll}
          disabled={isVerifying || results.length === 0}
        >
          {isVerifying ? 'Verifying...' : 'Verify All'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="text-bolt-elements-textTertiary">
                <th className="px-2 py-1">Network</th>
                <th className="px-2 py-1">Address</th>
                <th className="px-2 py-1">Tx</th>
                <th className="px-2 py-1">Verify</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.networkId} className="border-t border-bolt-elements-borderColor">
                  <td className="px-2 py-1">{item.networkLabel}</td>
                  <td className="px-2 py-1 font-mono">{item.status === 'success' ? item.address : item.error}</td>
                  <td className="px-2 py-1">
                    {item.explorerUrl ? (
                      <a className="text-accent-500 underline" href={item.explorerUrl} target="_blank" rel="noreferrer">
                        {item.txHash.slice(0, 10)}...
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {verifyResults[item.networkId]?.verifyUrl ? (
                      <a
                        className="text-accent-500 underline"
                        href={verifyResults[item.networkId].verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {verifyResults[item.networkId].status}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
