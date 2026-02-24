// Simple blockchain status checker using native JSON-RPC over HTTP(S)
// No external dependencies. Supports Anvil, Hardhat, and generic RPCs.

type ChainChoice = "anvil" | "hardhat" | "custom";

export async function chain_status(input: { chain?: ChainChoice; rpc_url?: string }): Promise<any> {
  const rpc_url = input?.rpc_url ?? "http://127.0.0.1:8545";

  // helper: perform a JSON-RPC call with timeout
  const fetchJsonRpc = async (method: string, params: any[] = []): Promise<any> => {
    // @ts-ignore - global fetch may be provided by Node >=18
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(rpc_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: controller.signal,
      } as any);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(String(data.error?.message ?? data.error));
      }
      return data.result;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    // Basic metrics
    const blockHex = await fetchJsonRpc("eth_blockNumber", []);
    const block_number = parseInt(blockHex, 16);
    const chainHex = await fetchJsonRpc("eth_chainId", []);
    const chain_id = parseInt(chainHex, 16);
    const accounts = await fetchJsonRpc("eth_accounts", []);
    const netVersion = await fetchJsonRpc("net_version", []);
    const gas_price = await fetchJsonRpc("eth_gasPrice", []);
    // Node type detection via client version
    const clientVersion = await fetchJsonRpc("web3_clientVersion", []);
    let node_type: "anvil" | "hardhat" | "geth" | "unknown" = "unknown";
    if (typeof clientVersion === "string") {
      const cv = clientVersion.toLowerCase();
      if (cv.includes("anvil")) node_type = "anvil";
      else if (cv.includes("hardhat")) node_type = "hardhat";
      else if (cv.includes("geth")) node_type = "geth";
      else node_type = "unknown";
    }
    const online = true;
    return {
      online,
      chain_id,
      block_number,
      accounts: Array.isArray(accounts) ? accounts : [],
      gas_price,
      rpc_url,
      node_type,
    };
  } catch (err: any) {
    return {
      online: false,
      error: String(err?.message ?? err),
      rpc_url,
    };
  }
}

export default chain_status;
