import type { ActionFunction } from "@remix-run/node";

type SimulationResult = {
  gasUsed: number;
  stateDiff: Array<{ slot: number; before: string; after: string }>;
  events: Array<{ address?: string; topics?: string[]; data?: string }>;
  returnValue?: string;
  revertReason?: string;
};

type RpcRequest = {
  jsonrpc: string;
  id?: number;
  method: string;
  params?: any[];
};

async function callLocalRpc(payload: RpcRequest) {
  const res = await fetch("http://localhost:8545", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  const data = await res.json();
  return data;
}

export const action: ActionFunction = async ({ request }) => {
  try {
    const body = await request.json();
    const to = body?.to;
    const value = body?.value ?? "0";
    const data = body?.data ?? "0x";
    // First try debug_traceCall, then fall back to eth_call
    let sim: SimulationResult | null = null;
    try {
      const trace = await callLocalRpc({ jsonrpc: "2.0", id: 1, method: "debug_traceCall", params: [ { to, data, value }, "latest", { } ] });
      // Best-effort parse; if trace has a result, map to our format
      const r = trace?.result ?? trace;
      sim = {
        gasUsed: (r?.gasUsed as number) ?? 0,
        stateDiff: Array.isArray(r?.stateDiff) ? (r.stateDiff as any) : [],
        events: Array.isArray(r?.events) ? (r.events as any) : [],
        returnValue: r?.returnValue ?? undefined,
        revertReason: r?.revertReason ?? undefined,
      };
    } catch {
      // fall back to eth_call
      const eth = await callLocalRpc({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [ { to, data }, "latest" ] });
      sim = {
        gasUsed: 0,
        stateDiff: [],
        events: [],
        returnValue: eth?.result ?? undefined,
      };
    }

    return new Response(JSON.stringify({ simulationResult: sim ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
