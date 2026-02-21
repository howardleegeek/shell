// Local transaction simulation utilities (mocked)
// Provides a deterministic, side-effect-free simulation of a transaction on a local chain.
// This module is used by both client-side store and Remix route to produce a structured result.

export type StateDiffEntry = { slot: string; before: string; after: string };
export type EventLog = { name: string; data: any };

export interface SimulationResult {
  gasUsed: number;
  stateDiff: StateDiffEntry[];
  events: EventLog[];
  returnValue?: string;
  revertReason?: string;
  // Optional fields for SVM mode compatibility
  computeUnits?: number;
  svmLogs?: any[];
}

export function simulateLocal(input: { to: string; value: number; calldata: string }): SimulationResult {
  try {
    const { to, value, calldata } = input;
    // Simple revert path for testing
    if (calldata?.startsWith('0xdead')) {
      return {
        gasUsed: 0,
        stateDiff: [],
        events: [],
        revertReason: 'Reverted by simulation: dead calldata',
        returnValue: '0x',
        computeUnits: 0,
        svmLogs: [],
      };
    }

    const gasUsed = Math.max(21000, (calldata?.length ?? 0) * 4 + value);
    const stateDiff: StateDiffEntry[] = [
      { slot: '0x0', before: '0x00', after: '0x01' },
      { slot: '0x1', before: '0x00', after: '0x02' },
    ];
    const events: EventLog[] = [
      { name: 'EventA', data: { from: to, value } },
    ];
    const returnValue = '0x' + (value >>> 0).toString(16);
    return {
      gasUsed,
      stateDiff,
      events,
      returnValue,
      revertReason: undefined,
      computeUnits: 1_000_000,
      svmLogs: [{ note: 'simulated' }],
    };
  } catch (err) {
    return {
      gasUsed: 0,
      stateDiff: [],
      events: [],
      revertReason: 'Internal simulation error',
      returnValue: '0x',
      computeUnits: 0,
      svmLogs: [],
    };
  }
}
