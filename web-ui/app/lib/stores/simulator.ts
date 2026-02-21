import React, { createContext, useContext, useState, ReactNode } from 'react';
import { simulateLocal, SimulationResult } from '../simulator';

export type SimulationStatus = 'idle' | 'simulating' | 'done' | 'error';

type SimulatorContextValue = {
  simulationResult?: SimulationResult;
  simulationStatus: SimulationStatus;
  simulate: (payload: { to: string; value: number; calldata: string }) => Promise<void>;
};

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export const SimulatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | undefined>(undefined);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');

  const simulate = async ({ to, value, calldata }: { to: string; value: number; calldata: string }) => {
    setSimulationStatus('simulating');
    try {
      // Call the Remix API route on the server side. Client can fetch a simulated response.
      const resp = await fetch('/api.simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, value, calldata }),
      });
      if (!resp.ok) throw new Error(`Simulation failed: ${resp.status}`);
      const json = await resp.json();
      setSimulationResult(json.simulationResult);
      setSimulationStatus('done');
    } catch (e) {
      setSimulationStatus('error');
    }
  };

  return (
    <SimulatorContext.Provider value={{ simulationResult, simulationStatus, simulate }}>
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => {
  const ctx = useContext(SimulatorContext);
  if (!ctx) {
    throw new Error('useSimulator must be used within SimulatorProvider');
  }
  return ctx;
};
