/**
 * Local Explorer (EVMequivalent) - TypeScript implementation
 *
 * This module attempts to query a local Ethereum-compatible JSON-RPC node
 * (eg. Anvil) at localhost:8545 to fetch latest block & transactions, and
 * then constructs a lightweight explorer report written to the project's
 * reports directory.
 *
 * If the local node is unavailable, a small mock dataset is generated to
 * satisfy developer scenarios and UI wiring.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

type EthTx = {
  hash: string;
  from?: string;
  to?: string;
  value?: string; // hex string (Wei)
};

type LocalExplorerReport = {
  ok: boolean;
  chain: "evm";
  startedAt: string;
  finishedAt: string;
  reportsDir: string;
  txs: EthTx[];
  accounts: { address: string; balance: string }[];
  raw?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

// Helper: post JSON-RPC payload to local Ethereum node.
async function rpcPost(payload: any, host = "127.0.0.1", port = 8545, path_ = "/") {
  const data = JSON.stringify(payload);
  const options: http.RequestOptions = {
    hostname: host,
    port,
    path: path_,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };
  return new Promise<any>((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve({ error: String(raw) });
        }
      });
    });
    req.on("error", (e) => {
      resolve({ error: String(e.message) });
    });
    req.write(data);
    req.end();
  });
}

function hexToEthString(hexVal?: string): string {
  if (!hexVal) return "0";
  try {
    const wei = BigInt(hexVal);
    const ethWei = 10n ** 18n;
    const whole = wei / ethWei;
    const frac = wei % ethWei;
    const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
    return fracStr.length ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return hexVal;
  }
}

async function fetchLocalBlockTxs(limit: number = 5): Promise<EthTx[]> {
  // Request latest block with full tx objects
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBlockByNumber",
    params: ["latest", true],
  };
  const resp = await rpcPost(payload);
  if (!resp || resp.error || !resp.result) return [];
  const block = resp.result as any;
  const txs: EthTx[] = (block?.transactions ?? []).slice(0, limit).map((t: any) => ({
    hash: t?.hash,
    from: t?.from,
    to: t?.to,
    value: t?.value,
  }));
  return txs;
}

async function fetchBalance(address: string): Promise<string> {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [address, "latest"],
  };
  const resp = await rpcPost(payload);
  if (!resp || resp.error || resp.result == null) return "0";
  // resp.result is hex string Wei
  return hexToEthString(resp.result);
}

export async function generateLocalExplorerReport(directory: string, maxTxs: number = 5): Promise<LocalExplorerReport> {
  const startedAt = nowIso();
  const reportsDir = path.join(directory, "reports");
  ensureDir(reportsDir);

  let txs: EthTx[] = [];
  let accounts: { address: string; balance: string }[] = [];
  let ok = true;

  try {
    const latestTxs = await fetchLocalBlockTxs(maxTxs);
    txs = latestTxs;
    const addresses = Array.from(new Set<string>([
      ...txs.map((t) => t.from).filter((v) => v),
      ...txs.map((t) => t.to).filter((v) => v),
    ]));
    const accs = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const bal = await fetchBalance(addr);
          return { address: addr, balance: bal };
        } catch {
          return { address: addr, balance: "0" };
        }
      })
    );
    accounts = accs;
  } catch {
    // Fallback to mock data if the local RPC is unavailable
    ok = false;
    txs = [
      { hash: "0xdeadbeef1", from: "0xabc1", to: "0xdef1", value: "0x0" },
      { hash: "0xdeadbeef2", from: "0xabc2", to: "0xdef2", value: "0xde0b6b3a7640000" },
    ];
    accounts = [
      { address: "0xabc1", balance: "0" },
      { address: "0xdef1", balance: "0" },
    ];
  }

  const finishedAt = nowIso();
  const report: LocalExplorerReport = {
    ok,
    chain: "evm",
    startedAt,
    finishedAt,
    reportsDir,
    txs,
    accounts,
  };

  // Persist report JSON to disk
  const jsonPath = path.join(reportsDir, "local-explorer.evm.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");
  // Return data for further use
  (report as any).path = jsonPath;
  return report;
}

export default generateLocalExplorerReport;
