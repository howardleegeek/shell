// Lightweight simulator store for the local TX simulator UI
// Provides a tiny observable pattern so UI components can react to changes

export type DiffRow = {
  slot: number;
  before: string;
  after: string;
};

export type EventLog = {
  address?: string;
  topics?: string[];
  data?: string;
};

export type SimulationResult = {
  gasUsed: number;
  stateDiff: DiffRow[];
  events: EventLog[];
  returnValue?: string;
  revertReason?: string;
};

export type SimulationStatus = "idle" | "simulating" | "done" | "error";

type Listener = (result: SimulationResult | null, status: SimulationStatus) => void;

let _result: SimulationResult | null = null;
let _status: SimulationStatus = "idle";
const _listeners: Listener[] = [];

export function subscribeSimulator(listener: Listener) {
  _listeners.push(listener);
  return () => {
    const i = _listeners.indexOf(listener);
    if (i >= 0) _listeners.splice(i, 1);
  };
}

function _notify() {
  for (const l of _listeners) l(_result, _status);
}

export function getSimulation() {
  return { result: _result, status: _status };
}

export function setSimulationResult(result: SimulationResult) {
  _result = result;
  _notify();
}

export function setSimulationStatus(status: SimulationStatus) {
  _status = status;
  _notify();
}

// Default no-op simulate function. UI will call into Remix API at runtime.
export async function simulateTransaction(payload: { to: string; value?: string; data?: string; }) {
  setSimulationStatus("simulating");
  try {
    const resp = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await resp.json();
    if (resp.ok) {
      if (json?.simulationResult) {
        setSimulationResult(json.simulationResult as SimulationResult);
      } else {
        // tolerate missing field by clearing result
        setSimulationResult({ gasUsed: 0, stateDiff: [], events: [], returnValue: json?.returnValue });
      }
      setSimulationStatus("done");
      return json;
    } else {
      setSimulationStatus("error");
      return json;
    }
  } catch (e) {
    setSimulationStatus("error");
    throw e;
  }
}
