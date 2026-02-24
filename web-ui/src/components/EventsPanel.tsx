import React, { useEffect, useMemo, useState } from 'react';

type Chain = 'evm' | 'solana';
export type ContractEvent = {
  timestamp: number; // ms since epoch
  eventName: string;
  txHash?: string;
  chain: Chain;
  address?: string; // contract address
  // common params by name; optional
  from?: string;
  to?: string;
  owner?: string;
  spender?: string;
  amount?: string;
  // raw data
  data?: Record<string, any>;
};

export interface EventStream {
  subscribe: (cb: (ev: ContractEvent) => void) => { unsubscribe: () => void };
}

export interface EventsPanelProps {
  stream?: EventStream;
  initialEvents?: ContractEvent[];
}

// Simple color rules for common events
const colorForEvent = (ev: ContractEvent): string => {
  switch (ev.eventName) {
    case 'Transfer':
      return '#22c55e'; // green
    case 'Approval':
      return '#3b82f6'; // blue
    case 'Error':
      return '#f87171'; // red
    default:
      return '#9ca3af'; // gray
  }
};

const formatTs = (ts: number) => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const toCSV = (rows: ContractEvent[]) => {
  const header = ['timestamp','eventName','address','from','to','owner','spender','amount','txHash','chain'];
  const lines = rows.map(r => [
    new Date(r.timestamp).toISOString(),
    r.eventName,
    r.address ?? '',
    r.from ?? '',
    r.to ?? '',
    r.owner ?? '',
    r.spender ?? '',
    r.amount ?? '',
    r.txHash ?? '',
    r.chain
  ].map(v => (`"${String(v).replace(/"/g, '""')}"`)).join(','));
  return header.map(h => `"${h}"`).join(',') + '\n' + lines.join('\n');
};

export const EventsPanel: React.FC<EventsPanelProps> = ({ stream, initialEvents = [] }) => {
  const [events, setEvents] = useState<ContractEvent[]>(initialEvents);
  const [filterName, setFilterName] = useState<string>('All');
  const [filterAddr, setFilterAddr] = useState<string>('');
  const [range, setRange] = useState<string>('All');

  // subscribe to stream
  useEffect(() => {
    if (!stream?.subscribe) return;
    const sub = stream.subscribe((ev) => {
      setEvents((cur) => [ev, ...cur]); // newest first
    });
    return () => sub.unsubscribe();
  }, [stream]);

  // derived filtered list
  const filtered = useMemo(() => {
    const cutoff = range === 'Last 1h' ? Date.now() - 3600 * 1000 : 0;
    return events
      .filter(e => (filterName === 'All' ? true : e.eventName === filterName))
      .filter(e => (filterAddr ? (e.address ?? '').toLowerCase().includes(filterAddr.toLowerCase()) : true))
      .filter(e => e.timestamp >= cutoff);
  }, [events, filterName, filterAddr, range]);

  const onExportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'events.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onExportCSV = () => {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'events.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onClear = () => setEvents([]);

  // simple inline styles
  const containerStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: 12,
    width: '100%',
    maxWidth: 720,
    fontFamily: 'ui-sans-serif, system-ui, -apple-system',
    background: '#0b1020',
    color: '#e5e7eb',
  };
  const headerStyle: React.CSSProperties = { fontWeight: 600, marginBottom: 8 };
  const rowStyle: React.CSSProperties = { padding: '4px 0' };
  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 72,
    height: 12,
    borderRadius: 6,
  };
  return (
    <div style={containerStyle} aria-label="events-panel">
      <div style={headerStyle}>Events</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <label>
          Filter:
          <select
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            style={{ marginLeft: 6 }}
          >
            <option>All</option>
            <option>Transfer</option>
            <option>Approval</option>
            <option>Error</option>
          </select>
        </label>
        <label>
          Last:
          <select value={range} onChange={e => setRange(e.target.value)} style={{ marginLeft: 6 }}>
            <option>All</option>
            <option>Last 1h</option>
          </select>
        </label>
        <label>
          Address:
          <input
            placeholder="contract address"
            value={filterAddr}
            onChange={e => setFilterAddr(e.target.value)}
            style={{ marginLeft: 6, width: 180 }}
          />
        </label>
        <button onClick={onExportJSON} style={{ marginLeft: 'auto' }}>Export JSON</button>
        <button onClick={onExportCSV} style={{ marginLeft: 6 }}>Export CSV</button>
        <button onClick={onClear} style={{ marginLeft: 6 }}>Clear</button>
      </div>
      <div>
        {filtered.length === 0 && <div style={{ color: '#94a3b8' }}>No events</div>}
        {filtered.map((ev, idx) => (
          <div key={idx} style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 80, color: '#93c5fd' }}>{formatTs(ev.timestamp)}</span>
              <span style={{ width: 140, color: colorForEvent(ev) }}>{ev.eventName}</span>
              <span style={tagStyle} aria-label="color-tag" />
            </div>
            <div style={{ marginLeft: 88, fontSize: 12, color: '#cbd5e1' }}>
              {ev.from && <span>from: {ev.from} </span>}
              {ev.to && <span> to: {ev.to} </span>}
              {ev.owner && <span> owner: {ev.owner} </span>}
              {ev.spender && <span> spender: {ev.spender} </span>}
              {ev.amount && <span> amount: {ev.amount} </span>}
              {ev.txHash && <span> tx: {ev.txHash} </span>}
              {ev.address && <span> addr: {ev.address} </span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPanel;
