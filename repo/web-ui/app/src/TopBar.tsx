import React from 'react';
import { useChain } from './ChainContext';

const CapsuleButton: React.FC<{ active?: boolean; label: string; onClick?: () => void }> = ({ active, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid #2b2f3a',
        background: active ? '#111827' : '#0e111a',
        color: '#c9d1d9',
        cursor: 'pointer',
        boxShadow: active ? '0 0 10px rgba(0,255,136,0.8)' : 'none',
        marginRight: 8,
      }}
      aria-pressed={!!active}
    >
      {label}
    </button>
  );
};

export const TopBar: React.FC = () => {
  const { chainType, setChainType, network, setNetwork, availableNetworks } = useChain();

  return (
    <div
      style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: '#0b0f14',
        borderBottom: '1px solid #1e1e1e',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CapsuleButton
          active={chainType === 'svm'}
          label="SVM"
          onClick={() => setChainType('svm')}
        />
        <CapsuleButton
          active={chainType === 'evm'}
          label="EVM"
          onClick={() => setChainType('evm')}
        />
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#8b949e', fontSize: 13 }}>Network</span>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          style={{
            background: '#0d1117',
            color: '#c9d1d9',
            border: '1px solid #30363d',
            borderRadius: 6,
            padding: '6px 10px',
          }}
        >
          {availableNetworks.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
