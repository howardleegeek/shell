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

export interface SimulationApiResponse {
  simulationResult?: SimulationResult;
  returnValue?: string;
  error?: string;
}

export type SimulatorRequestConfig = {
  endpoint: string;
  contentType: string;
};

export const SIMULATION_JSON_CONTENT_TYPE = "application/json";

const DEFAULT_SIMULATOR_REQUEST_CONFIG: SimulatorRequestConfig = {
  endpoint: "/api/simulate",
  contentType: SIMULATION_JSON_CONTENT_TYPE,
};

type Listener = (result: SimulationResult | null, status: SimulationStatus) => void;

let _result: SimulationResult | null = null;
let _status: SimulationStatus = "idle";
let _requestConfig: SimulatorRequestConfig = { ...DEFAULT_SIMULATOR_REQUEST_CONFIG };
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;

  if (typeof left !== typeof right) return false;
  if (left === null || right === null) return false;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (!deepEqual(left[i], right[i])) return false;
    }
    return true;
  }

  if (isObjectRecord(left) && isObjectRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
      if (!deepEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return false;
}

function parseDiffRows(value: unknown): DiffRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isObjectRecord)
    .map((row) => ({
      slot: typeof row.slot === "number" ? row.slot : 0,
      before: typeof row.before === "string" ? row.before : "",
      after: typeof row.after === "string" ? row.after : "",
    }));
}

function parseEventLogs(value: unknown): EventLog[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isObjectRecord)
    .map((event) => ({
      address: typeof event.address === "string" ? event.address : undefined,
      topics: Array.isArray(event.topics) ? event.topics.filter((topic): topic is string => typeof topic === "string") : undefined,
      data: typeof event.data === "string" ? event.data : undefined,
    }));
}

function parseSimulationResult(value: unknown): SimulationResult | undefined {
  if (!isObjectRecord(value)) return undefined;
  return {
    gasUsed: typeof value.gasUsed === "number" ? value.gasUsed : 0,
    stateDiff: parseDiffRows(value.stateDiff),
    events: parseEventLogs(value.events),
    returnValue: typeof value.returnValue === "string" ? value.returnValue : undefined,
    revertReason: typeof value.revertReason === "string" ? value.revertReason : undefined,
  };
}

function parseSimulationApiResponse(value: unknown): SimulationApiResponse {
  if (!isObjectRecord(value)) return {};
  return {
    simulationResult: parseSimulationResult(value.simulationResult),
    returnValue: typeof value.returnValue === "string" ? value.returnValue : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
  };
}

export function getSimulation() {
  return { result: _result, status: _status };
}

export function setSimulationResult(result: SimulationResult) {
  if (_result && deepEqual(_result, result)) return;
  _result = result;
  _notify();
}

export function setSimulationStatus(status: SimulationStatus) {
  _status = status;
  _notify();
}

export function setSimulatorRequestConfig(config: Partial<SimulatorRequestConfig>) {
  _requestConfig = { ..._requestConfig, ...config };
}

export function resetSimulatorRequestConfig() {
  _requestConfig = { ...DEFAULT_SIMULATOR_REQUEST_CONFIG };
}

// Default no-op simulate function. UI will call into Remix API at runtime.
export async function simulateTransaction(payload: { to: string; value?: string; data?: string; }) {
  setSimulationStatus("simulating");
  try {
    const resp = await fetch(_requestConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": _requestConfig.contentType },
      body: JSON.stringify(payload),
    });
    const rawJson: unknown = await resp.json();
    const json: SimulationApiResponse = parseSimulationApiResponse(rawJson);
    if (resp.ok) {
      if (json.simulationResult) {
        setSimulationResult(json.simulationResult);
      } else {
        // tolerate missing field by clearing result
        setSimulationResult({ gasUsed: 0, stateDiff: [], events: [], returnValue: json.returnValue });
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
