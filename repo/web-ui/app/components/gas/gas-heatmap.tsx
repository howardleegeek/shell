import React from 'react';

type HeatItem = { name: string; avg: number };

function colorForGas(avg: number): string {
  const v = Math.max(0, Math.min(1, avg / 100000));
  const r = Math.floor(255 * v);
  const g = Math.floor(255 * (1 - v));
  return `rgb(${r}, ${g}, 0)`;
}

export function GasHeatmap({ items }: { items: HeatItem[] }) {
  return (
    <div className="gas-heatmap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 12px)', gap: 4 }}>
      {items.map((it, idx) => (
        <div
          key={idx}
          title={`${it.name}: ${it.avg}`}
          style={{ width: 12, height: 12, background: colorForGas(it.avg), borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

export default GasHeatmap;
