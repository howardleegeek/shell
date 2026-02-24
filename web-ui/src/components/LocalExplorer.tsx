import React, { useMemo, useState } from 'react';

type Tx = { hash: string; from: string; to: string; value: string; status: 'Success' | 'Failed' | 'Pending' };

export default function LocalExplorer(): JSX.Element {
  const [tab, setTab] = useState<'evm' | 'solana'>('evm');

  const transactions: Tx[] = useMemo(() => [
    { hash: '0xabc123', from: '0xeee...111', to: '0xaaa...bbb', value: '1.0 ETH', status: 'Success' },
    { hash: '0xdef456', from: '0xccc...ddd', to: '0x999...zzz', value: '0.5 ETH', status: 'Success' },
  ], []);

  const balances = [
    { address: '0xabc...def', balance: '9,998.5 ETH' },
    { address: '0x123...456', balance: '1,001.5 ETH' },
  ];

  // Avoid hard-coded localhost in production environments; prefer env vars
  const defaultSol = 'http://127.0.0.1:8899'
  const defaultEvm = 'http://127.0.0.1:8000'
  const iframeSrc = tab === 'evm'
    ? (process.env.REACT_APP_EVM_EXPLORER_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_EVM_EXPLORER_URL : '') || defaultEvm)
    : (process.env.REACT_APP_SOLANA_EXPLORER_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SOLANA_EXPLORER_URL : '') || defaultSol);

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, Arial',
      padding: 16,
      color: '#e8e8f0',
      background: 'radial-gradient(circle at 20% 0%, rgba(30,0,60,0.6), transparent 40%), radial-gradient(circle at 100% 100%, rgba(0,120,120,0.4), transparent 30%), #0b0b14',
      minHeight: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Local Explorer</div>
        <div>
          <button onClick={() => setTab('evm')} style={{ marginRight: 8, padding: '8px 12px', borderRadius: 8, background: tab === 'evm' ? '#1f9d8f' : 'transparent', color: '#e8f7f3', border: '1px solid rgba(255,255,255,0.2)' }}>EVM Otterscan</button>
          <button onClick={() => setTab('solana')} style={{ padding: '8px 12px', borderRadius: 8, background: tab === 'solana' ? '#1f9d8f' : 'transparent', color: '#e8f7f3', border: '1px solid rgba(255,255,255,0.2)' }}>Solana Explorer</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        <section style={{ minHeight: 320, padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{tab === 'evm' ? 'Recent Transactions (EVm/Anvil)' : 'Recent Transactions (Solana)'}</div>
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            {transactions.map((t, idx) => (
              <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontFamily: 'monospace' }}>{t.hash}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{t.from} → {t.to} • {t.value} • {t.status}</div>
              </div>
            ))}
          </div>
        </section>
        <aside style={{ padding: 12, borderRadius: 12, minHeight: 320, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Accounts</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'left', fontSize: 12, opacity: 0.8 }}>Address</th><th style={{ textAlign: 'left', fontSize: 12, opacity: 0.8 }}>Balance</th></tr></thead>
            <tbody>
              {balances.map((b, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 0', fontFamily: 'monospace', fontSize: 12 }}>{b.address}</td>
                  <td style={{ padding: '6px 0', fontSize: 12 }}>{b.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            <a href={iframeSrc} style={{ color: '#8df2ff' }} target="_blank" rel="noreferrer">Open Full Explorer</a>
          </div>
        </aside>
      </div>

      <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.25)' }}>
        <iframe title="local-explorer-iframe" src={iframeSrc} style={{ width: '100%', height: 240, border: '0' }} />
      </div>
    </div>
  );
}
