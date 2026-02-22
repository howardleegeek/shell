import { useStore } from "@nanostores/react";
import { useEffect, useMemo, useState } from "react";
import { chainType, localChainStore, type ChainType } from "~/lib/stores/chain";
import { localChainManager } from "~/lib/web3/chain-manager";
import { getLocalChainConfig } from "~/lib/web3/local-chains";
import { isDesktop } from "~/lib/utils/platform";

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
    <div className="relative inline-flex items-center gap-1">
      {!isDesktop() && (
        <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
          Desktop
        </span>
      )}
      <button
        type="button"
        onClick={onToggleChain}
        disabled={isProcessing || !isDesktop()}
        title={!isDesktop() ? "Local chain is only available in the Desktop app" : `${activeConfig.name} · ${activeConfig.rpcUrl} · ${defaultAccountCount} default account${defaultAccountCount === 1 ? "" : "s"}`}
        className={`rounded-md items-center justify-center px-3 py-1.5 text-xs border outline-[#00ff88] flex gap-1.5 transition-all duration-150 ${
          isDesktop()
            ? "border-[#00ff88]/60 bg-[#080a14] text-[#b9ffd4] hover:text-white hover:bg-[#111326] hover:shadow-[0_0_16px_rgba(0,255,136,0.35)] [&:not(:disabled,.disabled)]:hover:bg-[#111326]"
            : "border-[#ff4d6d]/40 bg-[#080a14]/50 text-[#ff4d6d]/50 cursor-not-allowed opacity-60"
        } ${isProcessing ? "" : "[&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-65"}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isActiveChainRunning && isDesktop()
              ? "bg-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.95)]"
              : isDesktop()
              ? "bg-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.7)]"
              : "bg-[#555]"
          }`}
        />
        <span>{!isDesktop() ? "Desktop Only" : isProcessing ? "Working..." : buttonLabel}</span>
      </button>
    </div>
  );
}
