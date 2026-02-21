import React, { useMemo, useState } from 'react'

type OpcodeInfo = {
  code: number
  name: string
  gas: number
  category?: 'push' | 'stop' | 'call' | 'other'
  description?: string
  byteLength?: number
}

// Minimal opcode table. We include common opcodes and support PUSHn/DUPn/SWAPn generically.
const BASE_OPCODES: Record<number, Partial<OpcodeInfo>> = {
  0x00: { name: 'STOP', gas: 0, category: 'stop', description: 'Halts execution' },
  0x01: { name: 'ADD', gas: 3, category: 'other' },
  0x02: { name: 'MUL', gas: 5, category: 'other' },
  0x03: { name: 'SUB', gas: 3, category: 'other' },
  0x04: { name: 'DIV', gas: 5, category: 'other' },
  0x05: { name: 'SDIV', gas: 5, category: 'other' },
  0x06: { name: 'MOD', gas: 5, category: 'other' },
  0x07: { name: 'SMOD', gas: 5, category: 'other' },
  0x08: { name: 'ADDMOD', gas: 8, category: 'other' },
  0x09: { name: 'MULMOD', gas: 8, category: 'other' },
  0x0a: { name: 'EXP', gas: 10, category: 'other' },
  0x0b: { name: 'SIGNEXTEND', gas: 5, category: 'other' },
  0x10: { name: 'LT', gas: 3, category: 'other' },
  0x11: { name: 'GT', gas: 3, category: 'other' },
  0x12: { name: 'SLT', gas: 3, category: 'other' },
  0x13: { name: 'SGT', gas: 3, category: 'other' },
  0x14: { name: 'EQ', gas: 3, category: 'other' },
  0x15: { name: 'ISZERO', gas: 3, category: 'other' },
  0x16: { name: 'AND', gas: 3, category: 'other' },
  0x17: { name: 'OR', gas: 3, category: 'other' },
  0x18: { name: 'XOR', gas: 3, category: 'other' },
  0x19: { name: 'NOT', gas: 3, category: 'other' },
  0x1a: { name: 'BYTE', gas: 3, category: 'other' },
  0x20: { name: 'SHA3', gas: 30, category: 'other' },
  0x30: { name: 'ADDRESS', gas: 2, category: 'other' },
  0x31: { name: 'BALANCE', gas: 400, category: 'other' },
  0x32: { name: 'ORIGIN', gas: 2, category: 'other' },
  0x33: { name: 'CALLER', gas: 2, category: 'other' },
  0x34: { name: 'CALLVALUE', gas: 2, category: 'other' },
  0x35: { name: 'CALLDATALOAD', gas: 3, category: 'other' },
  0x36: { name: 'CALLDATASIZE', gas: 2, category: 'other' },
  0x37: { name: 'CALLDATACOPY', gas: 3, category: 'other' },
  0x38: { name: 'CODESIZE', gas: 2, category: 'other' },
  0x39: { name: 'CODECOPY', gas: 3, category: 'other' },
  0x3a: { name: 'GASPRICE', gas: 2, category: 'other' },
  0x3b: { name: 'EXTCODESIZE', gas: 700, category: 'other' },
  0x3c: { name: 'EXTCODECOPY', gas: 700, category: 'other' },
  0x3d: { name: 'RETURNDATASIZE', gas: 2, category: 'other' },
  0x3e: { name: 'RETURNDATACOPY', gas: 3, category: 'other' },
  0x40: { name: 'BLOCKHASH', gas: 20, category: 'other' },
  0x41: { name: 'COINBASE', gas: 2, category: 'other' },
  0x42: { name: 'TIMESTAMP', gas: 2, category: 'other' },
  0x43: { name: 'NUMBER', gas: 2, category: 'other' },
  0x44: { name: 'DIFFICULTY', gas: 2, category: 'other' },
  0x45: { name: 'GASLIMIT', gas: 2, category: 'other' },
  0x50: { name: 'POP', gas: 2, category: 'other' },
  0x51: { name: 'MLOAD', gas: 3, category: 'other' },
  0x52: { name: 'MSTORE', gas: 3, category: 'other' },
  0x53: { name: 'MSTORE8', gas: 3, category: 'other' },
  0x54: { name: 'SLOAD', gas: 2100, category: 'other' },
  0x55: { name: 'SSTORE', gas: 0, category: 'other' },
  0x56: { name: 'JUMP', gas: 8, category: 'other' },
  0x57: { name: 'JUMPI', gas: 10, category: 'other' },
  0x58: { name: 'PC', gas: 2, category: 'other' },
  0x59: { name: 'MSIZE', gas: 2, category: 'other' },
  0x5a: { name: 'GAS', gas: 2, category: 'other' },
  0x5b: { name: 'JUMPDEST', gas: 1, category: 'other' },
  0x60: { name: 'PUSH1', gas: 3, category: 'push', description: 'Pushes 1 byte onto stack' },
  0x61: { name: 'PUSH2', gas: 3, category: 'push', description: 'Pushes 2 bytes onto stack' },
  0x62: { name: 'PUSH3', gas: 3, category: 'push', description: 'Pushes 3 bytes onto stack' },
  0x63: { name: 'PUSH4', gas: 3, category: 'push', description: 'Pushes 4 bytes onto stack' },
  0x64: { name: 'PUSH5', gas: 3, category: 'push', description: 'Pushes 5 bytes onto stack' },
  0x65: { name: 'PUSH6', gas: 3, category: 'push', description: 'Pushes 6 bytes onto stack' },
  0x66: { name: 'PUSH7', gas: 3, category: 'push', description: 'Pushes 7 bytes onto stack' },
  0x67: { name: 'PUSH8', gas: 3, category: 'push', description: 'Pushes 8 bytes onto stack' },
  0x68: { name: 'PUSH9', gas: 3, category: 'push', description: 'Pushes 9 bytes onto stack' },
  0x69: { name: 'PUSH10', gas: 3, category: 'push', description: 'Pushes 10 bytes onto stack' },
  0x6a: { name: 'PUSH11', gas: 3, category: 'push', description: 'Pushes 11 bytes onto stack' },
  0x6b: { name: 'PUSH12', gas: 3, category: 'push', description: 'Pushes 12 bytes onto stack' },
  0x6c: { name: 'PUSH13', gas: 3, category: 'push', description: 'Pushes 13 bytes onto stack' },
  0x6d: { name: 'PUSH14', gas: 3, category: 'push', description: 'Pushes 14 bytes onto stack' },
  0x6e: { name: 'PUSH15', gas: 3, category: 'push', description: 'Pushes 15 bytes onto stack' },
  0x6f: { name: 'PUSH16', gas: 3, category: 'push', description: 'Pushes 16 bytes onto stack' },
  0x70: { name: 'PUSH17', gas: 3, category: 'push', description: 'Pushes 17 bytes onto stack' },
  0x71: { name: 'PUSH18', gas: 3, category: 'push', description: 'Pushes 18 bytes onto stack' },
  0x72: { name: 'PUSH19', gas: 3, category: 'push', description: 'Pushes 19 bytes onto stack' },
  0x73: { name: 'PUSH20', gas: 3, category: 'push', description: 'Pushes 20 bytes onto stack' },
  0x74: { name: 'PUSH21', gas: 3, category: 'push', description: 'Pushes 21 bytes onto stack' },
  0x75: { name: 'PUSH22', gas: 3, category: 'push', description: 'Pushes 22 bytes onto stack' },
  0x76: { name: 'PUSH23', gas: 3, category: 'push', description: 'Pushes 23 bytes onto stack' },
  0x77: { name: 'PUSH24', gas: 3, category: 'push', description: 'Pushes 24 bytes onto stack' },
  0x78: { name: 'PUSH25', gas: 3, category: 'push', description: 'Pushes 25 bytes onto stack' },
  0x79: { name: 'PUSH26', gas: 3, category: 'push', description: 'Pushes 26 bytes onto stack' },
  0x7a: { name: 'PUSH27', gas: 3, category: 'push', description: 'Pushes 27 bytes onto stack' },
  0x7b: { name: 'PUSH28', gas: 3, category: 'push', description: 'Pushes 28 bytes onto stack' },
  0x7c: { name: 'PUSH29', gas: 3, category: 'push', description: 'Pushes 29 bytes onto stack' },
  0x7d: { name: 'PUSH30', gas: 3, category: 'push', description: 'Pushes 30 bytes onto stack' },
  0x7e: { name: 'PUSH31', gas: 3, category: 'push', description: 'Pushes 31 bytes onto stack' },
  0x7f: { name: 'PUSH32', gas: 3, category: 'push', description: 'Pushes 32 bytes onto stack' },
  0x80: { name: 'DUP1', gas: 3, category: 'other', description: 'Duplicate 1st stack item' },
  0x81: { name: 'DUP2', gas: 3, category: 'other', description: 'Duplicate 2nd stack item' },
  0x82: { name: 'DUP3', gas: 3, category: 'other', description: 'Duplicate 3rd stack item' },
  0x83: { name: 'DUP4', gas: 3, category: 'other', description: 'Duplicate 4th stack item' },
  0x84: { name: 'DUP5', gas: 3, category: 'other', description: 'Duplicate 5th stack item' },
  0x85: { name: 'DUP6', gas: 3, category: 'other', description: 'Duplicate 6th stack item' },
  0x86: { name: 'DUP7', gas: 3, category: 'other', description: 'Duplicate 7th stack item' },
  0x87: { name: 'DUP8', gas: 3, category: 'other', description: 'Duplicate 8th stack item' },
  0x88: { name: 'DUP9', gas: 3, category: 'other', description: 'Duplicate 9th stack item' },
  0x89: { name: 'DUP10', gas: 3, category: 'other', description: 'Duplicate 10th stack item' },
  0x8a: { name: 'DUP11', gas: 3, category: 'other', description: 'Duplicate 11th stack item' },
  0x8b: { name: 'DUP12', gas: 3, category: 'other', description: 'Duplicate 12th stack item' },
  0x8c: { name: 'DUP13', gas: 3, category: 'other', description: 'Duplicate 13th stack item' },
  0x8d: { name: 'DUP14', gas: 3, category: 'other', description: 'Duplicate 14th stack item' },
  0x8e: { name: 'DUP15', gas: 3, category: 'other', description: 'Duplicate 15th stack item' },
  0x8f: { name: 'DUP16', gas: 3, category: 'other', description: 'Duplicate 16th stack item' },
  0x90: { name: 'SWAP1', gas: 3, category: 'other', description: 'Exchange 1st and 2nd stack items' },
  0x91: { name: 'SWAP2', gas: 3, category: 'other', description: 'Exchange 1st and 3rd stack items' },
  0x92: { name: 'SWAP3', gas: 3, category: 'other', description: 'Exchange 1st and 4th stack items' },
  0x93: { name: 'SWAP4', gas: 3, category: 'other', description: 'Exchange 1st and 5th stack items' },
  0x94: { name: 'SWAP5', gas: 3, category: 'other', description: 'Exchange 1st and 6th stack items' },
  0x95: { name: 'SWAP6', gas: 3, category: 'other', description: 'Exchange 1st and 7th stack items' },
  0x96: { name: 'SWAP7', gas: 3, category: 'other', description: 'Exchange 1st and 8th stack items' },
  0x97: { name: 'SWAP8', gas: 3, category: 'other', description: 'Exchange 1st and 9th stack items' },
  0x98: { name: 'SWAP9', gas: 3, category: 'other', description: 'Exchange 1st and 10th stack items' },
  0x99: { name: 'SWAP10', gas: 3, category: 'other', description: 'Exchange 1st and 11th stack items' },
  0x9a: { name: 'SWAP11', gas: 3, category: 'other', description: 'Exchange 1st and 12th stack items' },
  0x9b: { name: 'SWAP12', gas: 3, category: 'other', description: 'Exchange 1st and 13th stack items' },
  0x9c: { name: 'SWAP13', gas: 3, category: 'other', description: 'Exchange 1st and 14th stack items' },
  0x9d: { name: 'SWAP14', gas: 3, category: 'other', description: 'Exchange 1st and 15th stack items' },
  0x9e: { name: 'SWAP15', gas: 3, category: 'other', description: 'Exchange 1st and 16th stack items' },
  0x9f: { name: 'SWAP16', gas: 3, category: 'other', description: 'Exchange 1st and 17th stack items' },
  0xa0: { name: 'LOG0', gas: 375, category: 'other' },
  0xa1: { name: 'LOG1', gas: 750, category: 'other' },
  0xa2: { name: 'LOG2', gas: 1125, category: 'other' },
  0xa3: { name: 'LOG3', gas: 1500, category: 'other' },
  0xa4: { name: 'LOG4', gas: 1875, category: 'other' },
  0xf0: { name: 'CREATE', gas: 32000, category: 'call' },
  0xf1: { name: 'CALL', gas: 700, category: 'call', description: 'Message-call to another contract' },
  0xf2: { name: 'CALLCODE', gas: 700, category: 'call' },
  0xf3: { name: 'RETURN', gas: 0, category: 'stop', description: 'Return from execution' },
  0xf4: { name: 'DELEGATECALL', gas: 700, category: 'call' },
  0xf5: { name: 'CALLBLACKBOX', gas: 40, category: 'other' },
  0xf6: { name: 'STATICCALL', gas: 700, category: 'call' },
  0xfa: { name: 'CREATE2', gas: 32000, category: 'call' },
  0xfd: { name: 'REVERT', gas: 0, category: 'stop', description: 'Stop execution and revert state changes' },
  0xfe: { name: 'INVALID', gas: 0, category: 'stop', description: 'Designated invalid instruction' },
  0xff: { name: 'SELFDESTRUCT', gas: 0, category: 'stop', description: 'Destroy contract' },
}

function getOpcodeInfo(code: number, nextBytes?: number[]): OpcodeInfo {
  // PUSH1..PUSH32 range 0x60..0x7f
  if (code >= 0x60 && code <= 0x7f) {
    const n = code - 0x5f // number of bytes pushed
    return {
      code,
      name: `PUSH${n}`,
      gas: 3,
      category: 'push',
      description: 'Pushes immediate bytes onto the stack',
      byteLength: 1 + (n > 0 ? n : 0),
    }
  }
  // DUP1..DUP16: 0x80..0x8f
  if (code >= 0x80 && code <= 0x8f) {
    const n = code - 0x7f
    return { code, name: `DUP${n}`, gas: 3, category: 'other', description: 'Duplicate stack item' }
  }
  // SWAP1..SWAP16: 0x90..0x9f
  if (code >= 0x90 && code <= 0x9f) {
    const n = code - 0x8f
    return { code, name: `SWAP${n}`, gas: 3, category: 'other', description: 'Swap top stack items' }
  }
  const base = BASE_OPCODES[code]
  if (base?.name) {
    return {
      code,
      name: base.name,
      gas: base.gas ?? 0,
      category: (base.category as OpcodeInfo['category']) ?? 'other',
      description: base.description,
    }
  }
  // Unknown opcode
  const unkName = `OP_${code.toString(16).toUpperCase()}`
  return { code, name: unkName, gas: 0, category: 'other', description: 'Unknown opcode' }
}

type DisasmLine = {
  offset: number
  hex: string
  opcode: string
  operand?: string
  gas?: number
  description?: string
}

function disassemble(bytecodeHex: string): DisasmLine[] {
  const bytes = bytecodeHex.trim().replace(/\s+/g, '')
  // if starts with 0x, strip
  const normalized = bytes.startsWith('0x') ? bytes.slice(2) : bytes
  const arr: number[] = []
  for (let i = 0; i < normalized.length; i += 2) {
    const byte = parseInt(normalized.substr(i, 2), 16)
    if (Number.isNaN(byte)) continue
    arr.push(byte)
  }
  const lines: DisasmLine[] = []
  let i = 0
  while (i < arr.length) {
    const code = arr[i]
    // determine if PUSHn to know operand length
    if (code >= 0x60 && code <= 0x7f) {
      const n = code - 0x5f
      const operandBytes = arr.slice(i + 1, i + 1 + n)
      const hex = operandBytes.map(b => b.toString(16).padStart(2, '0')).join(' ')
      const info = getOpcodeInfo(code, operandBytes)
      lines.push({
        offset: i,
        hex: arr.slice(i, i + 1 + n).map(b => b.toString(16).padStart(2, '0')).join(' '),
        opcode: info.name,
        operand: operandBytes.length ? '0x' + operandBytes.map(b => b.toString(16).padStart(2, '0')).join('') : undefined,
        gas: info.gas,
        description: info.description,
      })
      i += 1 + n
      continue
    }
    const info = getOpcodeInfo(code)
    lines.push({
      offset: i,
      hex: code.toString(16).padStart(2, '0'),
      opcode: info.name,
      gas: info.gas,
      description: info.description,
    })
    i += 1
  }
  return lines
}

type Props = {
  bytecodeHex: string
  contractName?: string
}

const colorForCategory = (cat?: string) => {
  if (cat === 'push') return '#1a6dff' // blue-ish
  if (cat === 'stop' || cat === 'other' && false) return '#e53935' // red for stop-like
  if (cat === 'call') return '#f2b705' // yellow-ish
  return '#333'
}

export default function OpcodesViewer({ bytecodeHex, contractName }: Props) {
  const lines = useMemo(() => disassemble(bytecodeHex), [bytecodeHex])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<DisasmLine | null>(null)

  const visible = lines.filter(l => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return l.opcode.toLowerCase().includes(q) || (l.operand?.toLowerCase() ?? '').includes(q)
  })

  return (
    <div className="opcodes-viewer" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: 8 }}>
        <strong>{contractName ?? 'Bytecode'}</strong>
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          aria-label="opcode-filter"
          placeholder="Filter by opcode name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '6px 8px', width: 260, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div>
        {visible.length === 0 && <div style={{ fontStyle: 'italic' }}>No opcodes match the filter.</div>}
        {visible.map((l, idx) => {
          const color = colorForCategory((l as any).category)
          return (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 120px 1fr 120px', padding: '6px 0', alignItems: 'center' }}>
              <div style={{ color: '#666' }}>0x{l.offset.toString(16).padStart(2, '0')}</div>
              <div style={{ color: '#555' }}>{l.hex}</div>
              <div
                onClick={() => setSelected(l)}
                style={{ cursor: 'pointer', fontWeight: 600, color: color, userSelect: 'none' }}
                title={l.opcode}
              >
                {l.opcode}
              </div>
              <div style={{ color: '#444' }}>{l.operand ? l.operand : `gas ${l.gas ?? 0}`}</div>
              {/* Optional description popover */}
            </div>
          )
        })}
      </div>
      {selected && (
        <div role="note" style={{ marginTop: 8, padding: 8, border: '1px solid #ddd', borderRadius: 6, background: '#fff8dc' }}>
          <strong>{selected.opcode}</strong>
          {selected.description && <div style={{ marginTop: 4 }}>{selected.description}</div>}
          {selected.operand && <div style={{ marginTop: 4 }}>Operand: {selected.operand}</div>}
          <div style={{ marginTop: 4, color: '#666' }}>Gas: {selected.gas}</div>
        </div>
      )}
    </div>
  )
}
