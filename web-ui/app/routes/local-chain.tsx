import React, { useEffect, useState } from 'react';

type Status = {
  svm: { state: string; pid: number | null };
  evm: { state: string; pid: number | null };
};

export default function LocalChainPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api.local-chain');
      const data = await res.json();
      if (data?.status) {
        setStatus(data.status as Status);
      } else {
        // Fallback in case of unexpected payload
        setStatus({ svm: { state: 'unknown', pid: null }, evm: { state: 'unknown', pid: null } });
      }
    } catch {
      setStatus({ svm: { state: 'unknown', pid: null }, evm: { state: 'unknown', pid: null } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const doAction = async (action: string) => {
    const res = await fetch('/api.local-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    // Refresh status after action
    await loadStatus();
    return res.json();
  };

  const renderRow = (name: string, row: { state: string; pid: number | null }, start: () => void, stop: () => void, rpc?: string) => (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginBottom: 12, maxWidth: 520 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{name}</strong>
        <span style={{ fontSize: 12, color: '#666' }}>{row.state === 'running' ? 'Running' : 'Stopped'}</span>
      </div>
      <div style={{ marginTop: 8, color: '#333' }}>
        RPC: {rpc ?? 'n/a'}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={start} disabled={row.state === 'running'}>Start</button>
        <button onClick={stop} disabled={row.state !== 'running'}>Stop</button>
      </div>
    </div>
  );

  // Defensive defaults if status not yet loaded
  const svm = status?.svm ?? { state: 'unknown', pid: null };
  const evm = status?.evm ?? { state: 'unknown', pid: null };

  return (
    <div style={{ padding: 20 }}>
      <h2>Local Chain</h2>
      <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
        {renderRow(
          'SVM (Solana Test Validator)',
          { state: svm.state },
          () => doAction('start-svm'),
          () => doAction('stop-svm'),
          'http://localhost:8899'
        )}
        {renderRow(
          'EVM (Anvil)',
          { state: evm.state },
          () => doAction('start-evm'),
          () => doAction('stop-evm'),
          'http://localhost:8545'
        )}
      </div>
      {loading ? <div>Loading status…</div> : null}
    </div>
  );
}
