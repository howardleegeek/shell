import { useStore } from "@nanostores/react";
import { useEffect, useMemo, useState } from "react";
import { chainType, localChainStore, type ChainType } from "~/lib/stores/chain";
import { localChainManager } from "~/lib/web3/chain-manager";
import { getLocalChainConfig } from "~/lib/web3/local-chains";

const STATUS_REFRESH_INTERVAL_MS = 5_000;

function getButtonLabel(currentChainType: ChainType, isRunning: boolean) {
  const target = currentChainType === "evm" ? "Anvil" : "Validator";
  return `${isRunning ? "Stop" : "Start"} ${target}`;
}

export function LocalChainButton() {
  const activeChainType = useStore(chainType);
  const runtime = useStore(localChainStore);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeConfig = useMemo(
    () => getLocalChainConfig(activeChainType),
    [activeChainType],
  );
  const isActiveChainRunning =
    runtime.status === "running" && runtime.chainType === activeChainType;
  const defaultAccountCount =
    localChainManager.getDefaultAccounts(activeChainType).length;
  const buttonLabel = getButtonLabel(activeChainType, isActiveChainRunning);

  useEffect(() => {
    let disposed = false;

    const syncStatus = async () => {
      if (disposed) {
        return;
      }

      await localChainManager.getChainStatus(activeChainType);
    };

    void syncStatus();

    const intervalId = setInterval(() => {
      void syncStatus();
    }, STATUS_REFRESH_INTERVAL_MS);

    return () => {
      disposed = true;
      clearInterval(intervalId);
    };
  }, [activeChainType]);

  const onToggleChain = async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      if (isActiveChainRunning) {
        await localChainManager.stopLocalChain();
      } else {
        await localChainManager.startLocalChain(activeChainType);
      }

      await localChainManager.getChainStatus(activeChainType);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onToggleChain}
      disabled={isProcessing}
      title={`${activeConfig.name} · ${activeConfig.rpcUrl} · ${defaultAccountCount} default account${defaultAccountCount === 1 ? "" : "s"}`}
      className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-65 px-3 py-1.5 text-xs border border-[#00ff88]/60 bg-[#080a14] text-[#b9ffd4] hover:text-white [&:not(:disabled,.disabled)]:hover:bg-[#111326] [&:not(:disabled,.disabled)]:hover:shadow-[0_0_16px_rgba(0,255,136,0.35)] outline-[#00ff88] flex gap-1.5 transition-all duration-150"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isActiveChainRunning
            ? "bg-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.95)]"
            : "bg-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.7)]"
        }`}
      />
      <span>{isProcessing ? "Working..." : buttonLabel}</span>
    </button>
  );
}
