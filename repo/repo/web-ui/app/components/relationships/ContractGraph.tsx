import React from 'react';

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type Edge = { from: string; to: string };

// Simple static graph illustrating imports and inheritance relationships
const NODES: Node[] = [
  { id: 'Test', label: 'Test.sol', x: 20, y: 20 },
  { id: 'Ownable', label: 'OpenZeppelin Ownable', x: 180, y: 60 },
  { id: 'IERC20', label: 'IERC20', x: 180, y: 140 },
  { id: 'ERC20', label: 'ERC20', x: 320, y: 140 },
];

const EDGES: Edge[] = [
  { from: 'Test', to: 'IERC20' },
  { from: 'Test', to: 'Ownable' },
  { from: 'ERC20', to: 'IERC20' },
];

const ContractGraph: React.FC = () => {
  const width = 420;
  const height = 180;
  return (
    <svg width={width} height={height} role="img" aria-label="Contract relationship graph">
      {EDGES.map((e, idx) => {
        const a = NODES.find((n) => n.id === e.from)!;
        const b = NODES.find((n) => n.id === e.to)!;
        return (
          <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6b7280" strokeWidth={2} />
        );
      })}
      {NODES.map((n) => (
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
          <circle r={10} fill="#1f2937" stroke="#9ca3af" />
          <text x={14} y={4} fontSize={12} fill="#c7d2fe">{n.label}</text>
        </g>
      ))}
    </svg>
  );
};

export default ContractGraph;
