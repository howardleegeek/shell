import {
  chainType as selectedChainType,
  localChainRuntime,
  resetLocalChainRuntime,
  setLocalChainRuntime,
  type ChainType,
} from "~/lib/stores/chain";
import { workbenchStore } from "~/lib/stores/workbench";
import { getLocalChainConfig } from "./local-chains";

const SHELL_READY_TIMEOUT_MS = 10_000;
const HEALTH_CHECK_TIMEOUT_MS = 2_500;
const HEALTH_CHECK_POLL_ATTEMPTS = 6;
const HEALTH_CHECK_POLL_INTERVAL_MS = 500;
const RUNNING_STATE_FALLBACK_MS = 30_000;
const CTRL_C_SIGNAL = "\u0003";

export interface LocalChainStatus {
  chainType: ChainType | null;
  isRunning: boolean;
  rpcUrl: string | null;
  healthCheckUrl: string | null;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBoltShellReady() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      workbenchStore.boltTerminal.ready(),
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Terminal is still initializing.")),
          SHELL_READY_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export class LocalChainManager {
  async startLocalChain(chain: ChainType) {
    const chainConfig = getLocalChainConfig(chain);
    const runtime = localChainRuntime.get();

    workbenchStore.setShowWorkbench(true);
    workbenchStore.toggleTerminal(true);
    await waitForBoltShellReady();

    if (
      runtime.status === "running" &&
      runtime.chainType &&
      runtime.chainType !== chain
    ) {
      await this.stopLocalChain();
    }

    setLocalChainRuntime({
      status: "starting",
      chainType: chain,
      rpcUrl: chainConfig.rpcUrl,
      healthCheckUrl: chainConfig.healthCheckUrl,
    });

    this.#sendToBoltTerminal(chainConfig.startCommand);

    await this.#waitForHealth(chain);

    setLocalChainRuntime({
      status: "running",
      chainType: chain,
      rpcUrl: chainConfig.rpcUrl,
      healthCheckUrl: chainConfig.healthCheckUrl,
    });

    return localChainRuntime.get();
  }

  async stopLocalChain() {
    const runtime = localChainRuntime.get();
    const activeChainType = runtime.chainType ?? selectedChainType.get();
    const chainConfig = getLocalChainConfig(activeChainType);

    workbenchStore.setShowWorkbench(true);
    workbenchStore.toggleTerminal(true);
    await waitForBoltShellReady();

    setLocalChainRuntime({
      status: "stopping",
      chainType: runtime.chainType ?? activeChainType,
      rpcUrl: runtime.rpcUrl ?? chainConfig.rpcUrl,
      healthCheckUrl: runtime.healthCheckUrl ?? chainConfig.healthCheckUrl,
    });

    this.#sendToBoltTerminal(chainConfig.stopCommand, {
      asSignal: chainConfig.stopCommand === CTRL_C_SIGNAL,
    });

    const stillRunning = await this.#waitForUnhealthy(activeChainType);

    if (stillRunning) {
      setLocalChainRuntime({ status: "running", chainType: activeChainType });
      return localChainRuntime.get();
    }

    resetLocalChainRuntime();

    return localChainRuntime.get();
  }

  async getChainStatus(
    chain: ChainType = selectedChainType.get(),
  ): Promise<LocalChainStatus> {
    const runtime = localChainRuntime.get();
    const chainConfig = getLocalChainConfig(chain);
    const healthy = await this.#checkHealth(chain);

    if (healthy) {
      setLocalChainRuntime({
        status: "running",
        chainType: chain,
        rpcUrl: chainConfig.rpcUrl,
        healthCheckUrl: chainConfig.healthCheckUrl,
      });

      return {
        chainType: chain,
        isRunning: true,
        rpcUrl: chainConfig.rpcUrl,
        healthCheckUrl: chainConfig.healthCheckUrl,
      };
    }

    if (
      runtime.status === "running" &&
      runtime.chainType === chain &&
      Date.now() - runtime.lastUpdatedAt <= RUNNING_STATE_FALLBACK_MS
    ) {
      return {
        chainType: chain,
        isRunning: true,
        rpcUrl: chainConfig.rpcUrl,
        healthCheckUrl: chainConfig.healthCheckUrl,
      };
    }

    if (runtime.chainType === chain) {
      resetLocalChainRuntime();
    }

    return {
      chainType: null,
      isRunning: false,
      rpcUrl: null,
      healthCheckUrl: null,
    };
  }

  getDefaultAccounts(chain: ChainType) {
    return [...getLocalChainConfig(chain).defaultAccounts];
  }

  async #waitForHealth(chain: ChainType) {
    for (let i = 0; i < HEALTH_CHECK_POLL_ATTEMPTS; i++) {
      const healthy = await this.#checkHealth(chain);

      if (healthy) {
        return true;
      }

      await wait(HEALTH_CHECK_POLL_INTERVAL_MS);
    }

    return false;
  }

  async #waitForUnhealthy(chain: ChainType) {
    for (let i = 0; i < HEALTH_CHECK_POLL_ATTEMPTS; i++) {
      const healthy = await this.#checkHealth(chain);

      if (!healthy) {
        return false;
      }

      await wait(HEALTH_CHECK_POLL_INTERVAL_MS);
    }

    return true;
  }

  async #checkHealth(chain: ChainType) {
    const config = getLocalChainConfig(chain);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT_MS,
    );

    try {
      if (chain === "evm") {
        const response = await fetch(config.healthCheckUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_chainId",
            params: [],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return false;
        }

        const payload = (await response.json()) as {
          result?: string;
          error?: unknown;
        };

        return (
          typeof payload.result === "string" &&
          payload.result.length > 0 &&
          !payload.error
        );
      }

      const response = await fetch(config.healthCheckUrl, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        return false;
      }

      const responseText = (await response.text()).toLowerCase();

      return responseText.includes("ok") || responseText.includes("healthy");
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  #sendToBoltTerminal(command: string, options?: { asSignal?: boolean }) {
    const terminal = workbenchStore.boltTerminal.terminal;

    if (!terminal) {
      throw new Error("Bolt terminal is unavailable.");
    }

    if (options?.asSignal) {
      terminal.input(command);
      return;
    }

    terminal.input(`${command.trim()}\n`);
  }
}

export const localChainManager = new LocalChainManager();
