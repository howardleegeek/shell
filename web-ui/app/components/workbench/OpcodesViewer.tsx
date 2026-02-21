import React, { useMemo, useState } from 'react';

type DisassembledRow = {
  offset: number;
  hex: string; // opcode byte hex
  opcode: string;
  operand?: string; // space separated hex bytes
  gas: number;
  description?: string;
};

// Minimal opcode table. This is sufficient for local testing and debugging.
const OPCODES: Record<number, { name: string; gas: number; description?: string; push?: boolean }> = {
  0x00: { name: 'STOP', gas: 0, description: 'Halts execution' },
  0x01: { name: 'ADD', gas: 3, description: 'Integer addition' },
  0x02: { name: 'MUL', gas: 5, description: 'Integer multiplication' },
  0x03: { name: 'SUB', gas: 3, description: 'Integer subtraction' },
  0x04: { name: 'DIV', gas: 5, description: 'Integer division' },
  0x50: { name: 'POP', gas: 2, description: 'Pop value from stack' },
  0x51: { name: 'MLOAD', gas: 3, description: 'Load word from memory' },
  0x52: { name: 'MSTORE', gas: 3, description: 'Save word to memory' },
  0x53: { name: 'MSTORE8', gas: 3, description: 'Store byte to memory' },
  0x54: { name: 'SLOAD', gas: 200, description: 'Load from storage' },
  0x55: { name: 'SSTORE', gas: 5000, description: 'Store to storage' },
  0x56: { name: 'JUMP', gas: 8, description: 'Jump' },
  0x57: { name: 'JUMPI', gas: 10, description: 'Conditional jump' },
  0x5b: { name: 'JUMPDEST', gas: 1, description: 'Jump destination' },
  0x60: { name: 'PUSH1', gas: 3, description: 'Push 1-byte immediate', push: true },
  0x61: { name: 'PUSH2', gas: 3, description: 'Push 2-byte immediate', push: true },
  0x62: { name: 'PUSH3', gas: 3, description: 'Push 3-byte immediate', push: true },
  0x7f: { name: 'PUSH32', gas: 3, description: 'Push 32-byte immediate', push: true },
  0x80: { name: 'DUP1', gas: 3, description: 'Duplicate 1st stack item' },
  0x90: { name: 'SWAP1', gas: 3, description: 'Swap 1st two stack items' },
  0xf3: { name: 'RETURN', gas: 0, description: 'End execution and return' },
  0xfd: { name: 'REVERT', gas: 0, description: 'End execution with revert' },
  0xff: { name: 'SELFDESTRUCT', gas: 0, description: 'Destroy contract' },
  0xf1: { name: 'CALL', gas: 40, description: 'Call another contract' },
  0xF0: { name: 'CREATE', gas: 32000, description: 'Create contract' },
};

function hex(value: number, digits = 2) {
  return value.toString(16).toUpperCase().padStart(digits, '0');
}

function disassemble(bytecodeHex: string): DisassembledRow[] {
  // Normalize and convert hex string to byte array
  const hexClean = bytecodeHex.trim().replace(/[^0-9a-fA-F]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i + 1 < hexClean.length; i += 2) {
    bytes.push(parseInt(hexClean.substr(i, 2), 16));
  }

  const rows: DisassembledRow[] = [];
  for (let i = 0; i < bytes.length; ) {
    const op = bytes[i];
    const info = OPCODES[op] ?? { name: 'UNKNOWN', gas: 0, description: 'Unknown opcode' };
    // PUSHn handling
    const pushBytes = info.push ? Math.min(32, op - 0x5f) : 0;
    const operandBytes = pushBytes > 0 ? bytes.slice(i + 1, i + 1 + pushBytes) : [];
    const hexByte = hex(bytes[i]);
    const operandHex = operandBytes.map((b) => hex(b)).join(' ');
    rows.push({
      offset: i,
      hex: hexByte,
      opcode: info.name,
      operand: operandHex || undefined,
      gas: info.gas,
      description: info.description,
    });
    i += 1 + operandBytes.length;
  }
  return rows;
}

export interface OpcodesViewerProps {
  bytecodeHex: string;
}

export default function OpcodesViewer({ bytecodeHex }: OpcodesViewerProps) {
  const rows = useMemo(() => disassemble(bytecodeHex ?? ''), [bytecodeHex]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.opcode.toLowerCase().includes(q));
  }, [rows, query]);

  const renderGas = (g: number) => (
    <span style={{ marginLeft: 6, fontSize: 12, color: '#666' }}>{g}</span>
  );

  const opcodeClass = (name: string) => {
    if (name.startsWith('PUSH')) return 'op--blue';
    if (name === 'STOP' || name === 'REVERT') return 'op--red';
    if (name.startsWith('CALL')) return 'op--yellow';
    return 'op';
  };

  return (
    <div className="opc-viewer" style={{ fontFamily: 'Inter, system-ui, Arial', fontSize: 14 }}>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          aria-label="opcode-filter"
          placeholder="Filter by opcode name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        />
        <span style={{ color: '#888' }}>{filtered.length} / {rows.length} opcodes</span>
      </div>
      <div style={{ borderTop: '1px solid #eee' }} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Offset</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Hex</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Opcode</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Operand</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Gas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const isExpanded = expanded === idx;
              return (
                <React.Fragment key={r.offset}>
                  <tr
                    onClick={() => setExpanded(isExpanded ? null : idx)}
                    style={{ cursor: 'pointer', verticalAlign: 'top' }}
                    aria-label={`opcode-${r.offset}-${r.opcode}`}
                  >
                    <td style={{ padding: '6px 8px' }}>{r.offset}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={opcodeClass(r.opcode)} style={{ color: '#333' }}>
                        {r.hex}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={opcodeClass(r.opcode)} style={{ fontWeight: 600 }}>
                        {r.opcode}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#555' }}>
                      {r.operand ?? ''}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{renderGas(r.gas)}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} style={{ padding: '6px 8px', background: '#f9f9f9' }}>
                        <span style={{ fontSize: 12, color: '#555' }}>{r.description ?? ''}</span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>
        {`
        .op { }
        .op--blue { color: #1e90ff; }
        .op--red { color: #d00; }
        .op--yellow { color: #f5a623; }
        `}
      </style>
    </div>
  );
}
