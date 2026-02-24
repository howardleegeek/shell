import React from 'react';

type GasItem = {
  name: string;
  min: number;
  avg: number;
  max: number;
  calls: number;
};

// Lightweight internal parser mirroring JS gasProfiler.js behavior
function parseGasReportInternal(text: string): GasItem[] {
  const lines = (text || '').split(/\r?\n/);
  const res: GasItem[] = [];
  for (const line of lines) {
    if (!line || line.trim() === '') continue;
    let m = line.match(/Function:\s*(.+?)\s+min:\s*(\d+)\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i);
    if (!m) {
      m = line.match(/Function:\s*(.+?)\s+min:\s*(\d+)\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i);
    }
    if (m) {
      res.push({
        name: m[1].trim(),
        min: Number(m[2]),
        avg: Number(m[3]),
        max: Number(m[4]),
        calls: Number(m[5]),
      });
    }
  }
  return res;
}

function colorForGas(avg: number): string {
  const v = Math.max(0, Math.min(1, avg / 100000));
  const r = Math.floor(255 * v);
  const g = Math.floor(255 * (1 - v));
  return `rgb(${r}, ${g}, 0)`;
}

export function GasProfilerPanel({ reportText }: { reportText: string }) {
  const items = parseGasReportInternal(reportText);
  const totalGas = items.reduce((acc, it) => acc + it.avg, 0);
  return (
    <div className="gas-profiler-panel" style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Gas Profiler</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Function</th>
            <th>avg</th>
            <th>max</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} style={{ background: idx % 2 ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: '6px 8px' }}>{it.name}</td>
              <td style={{ padding: '6px 8px', color: '#111' }}>{it.avg.toLocaleString()}</td>
              <td style={{ padding: '6px 8px' }}>{it.max.toLocaleString()}</td>
              <td style={{ padding: '6px 8px' }}>
                <span style={{ background: colorForGas(it.avg), padding: '2px 6px', borderRadius: 4 }}>{''}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
        Total deployment: {totalGas.toLocaleString()} gas
      </div>
    </div>
  );
}

export default GasProfilerPanel;
