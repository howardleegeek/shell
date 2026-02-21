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
  0x0a: { name: 'EXP', gas: 10, category: 'other' },
  0x10: { name: 'LT', gas: 3, category: 'other' },
  0x11: { name: 'GT', gas: 3, category: 'other' },
  0x14: { name: 'EQ', gas: 3, category: 'other' },
  0x15: { name: 'ISZERO', gas: 3, category: 'other' },
  0x56: { name: 'JUMP', gas: 8, category: 'other' },
  0x57: { name: 'JUMPI', gas: 10, category: 'other' },
  0x5b: { name: 'JUMPDEST', gas: 1, category: 'other' },
  0xf1: { name: 'CALL', gas: 700, category: 'call', description: 'Message-call to another contract' },
  0xf4: { name: 'DELEGATECALL', gas: 700, category: 'call' },
  0xfa: { name: 'STATICCALL', gas: 700, category: 'call' },
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
