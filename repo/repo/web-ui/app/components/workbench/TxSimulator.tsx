import React, { useEffect, useMemo, useState } from "react";
import { simulateTransaction, getSimulation, subscribeSimulator, SimulationResult } from "../../lib/stores/simulator";

type DiffRow = { slot: number; before: string; after: string };
type EventLog = { address?: string; topics?: string[]; data?: string };

const containerStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
  maxWidth: 800,
};
const inputRow: React.CSSProperties = { display: "flex", gap: 8, marginBottom: 8 };
const labelStyle: React.CSSProperties = { width: 60, fontSize: 14, color: "#374151" };
const inputStyle: React.CSSProperties = { flex: 1, padding: 8, borderRadius: 4, border: "1px solid #d1d5db" };
const btnStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, border: "none", background: "#2563eb", color: "white", cursor: "pointer" };
const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%" } as any;
const thStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: 8 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #f3f4f6", padding: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas" as any };

export const TxSimulator: React.FC = () => {
  const [to, setTo] = useState("0x0000000000000000000000000000000000000000");
  const [value, setValue] = useState("0");
  const [calldata, setCalldata] = useState("0x");

  const [sub, setSub] = useState<() => void>(() => () => {});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "simulating" | "done" | "error">("idle");

  // subscribe to global simulator state in case other parts change it
  useEffect(() => {
    const unsubscribe = subscribeSimulator((r, s) => {
      if (typeof r !== "undefined") setResult(r);
      if (s) setStatus(s);
    });
    // initialize local status from store
    const init = getSimulation();
    if (init.status) setStatus(init.status);
    if (init.result) setResult(init.result);
    setSub(() => unsubscribe);
    return () => {
      unsubscribe();
    };
  }, []);

  const onSimulate = async () => {
    // call the store's simulate wrapper which hits /api/simulate
    try {
      const payload = { to, value, data: calldata };
      await simulateTransaction(payload);
    } catch (e) {
      console.error(e);
    }
  };

  const diffRows = result?.stateDiff ?? [];
  const events = result?.events ?? [];
  const gas = result?.gasUsed ?? 0;

  return (
    <div style={containerStyle}>
      <h3 style={{ marginTop: 0 }}>Tx Simulator</h3>
      <div style={inputRow}>
        <label style={labelStyle}>To</label>
        <input style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div style={inputRow}>
        <label style={labelStyle}>Value</label>
        <input style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div style={inputRow}>
        <label style={labelStyle}>Calldata</label>
        <input style={inputStyle} value={calldata} onChange={(e) => setCalldata(e.target.value)} />
      </div>
      <button style={btnStyle} onClick={onSimulate} disabled={status === "simulating"}>
        {status === "simulating" ? "Simulating..." : "Simulate"}
      </button>

      <hr style={{ margin: "16px 0" }} />
      <div>
        <div><strong>Gas Used:</strong> {gas}</div>
        <div style={{ marginTop: 8 }}>
          <strong>State Diff</strong>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Slot</th>
                <th style={thStyle}>Before</th>
                <th style={thStyle}>After</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((r, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{r.slot}</td>
                  <td style={tdStyle}>{r.before}</td>
                  <td style={tdStyle}>{r.after}</td>
                </tr>
              ))}
              {diffRows.length === 0 && (
                <tr><td style={tdStyle} colSpan={3}>No state diffs available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Events</strong>
          {events.length === 0 && <div style={{ fontStyle: "italic" }}>No events</div>}
          <ul>
            {events.map((e, i) => (
              <li key={i}>{JSON.stringify(e)}</li>
            ))}
          </ul>
        </div>
        {result?.revertReason && (
          <div style={{ marginTop: 8 }}>
            <strong>Revert Reason</strong>
            <div>{result.revertReason}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TxSimulator;
