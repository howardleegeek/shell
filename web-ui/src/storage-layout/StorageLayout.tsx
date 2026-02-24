import React, { FC, useState } from 'react'

// Simple storage layout visualization component for EVM contracts.
// This is a lightweight, self-contained UI to render slot data and provide
// basic decoding of 32-byte slot values to human-friendly values.

export interface SlotInfo {
  slot: number
  name: string
  type: string
  offset?: number
  bytes: number
}

export interface StorageLayoutProps {
  layout: SlotInfo[]
  title?: string
  compare?: SlotInfo[] | null
}

const typeColor: Record<string, string> = {
  address: '#e0ffd6',
  uint256: '#d6f5ff',
  int256: '#d6f5ff',
  bool: '#fff3c4',
  bytes32: '#e6d6ff',
}

function toBytes16(n: number) {
  // helper for small formatting
  return n.toString().padStart(2, '0')
}

function decodeSlotValue(hex32: string, typeName: string): string {
  let hex = hex32.trim()
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2)
  // Normalize to 64 hex chars
  if (hex.length < 64) hex = hex.padStart(64, '0')
  if (hex.length > 64) hex = hex.slice(0, 64)

  // address: last 20 bytes (40 hex chars)
  if (typeName === 'address') {
    const addr = '0x' + hex.slice(24)
    return addr
  }
  // bool: non-zero means true
  if (typeName === 'bool') {
    const isNonZero = BigInt('0x' + hex) !== 0n
    return isNonZero ? 'true' : 'false'
  }
  // uint256 / int256 / others: treat as big integer
  try {
    const value = BigInt('0x' + hex)
    return value.toString()
  } catch {
    // fallback hex string
    return '0x' + hex
  }
}

export const StorageLayout: FC<StorageLayoutProps> = ({ layout, title = 'Storage Layout', compare }) => {
  const [decodes, setDecodes] = useState<Record<number, string>>({})

  const onHexChange = (idx: number, val: string) => {
    const next = { ...decodes, [idx]: val }
    setDecodes(next)
  }

  const getDecoded = (idx: number, typeName: string) => {
    const hex = decodes[idx]
    if (!hex) return ''
    try {
      return decodeSlotValue(hex, typeName)
    } catch {
      return 'invalid'
    }
  }

  const totalBytes = layout.reduce((acc, s) => acc + s.bytes, 0)
  const packingBytesAvailable = Math.max(0, layout.length * 32 - totalBytes)

  const renderTable = (rows: SlotInfo[], dataTestIdPrefix: string) => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Slot</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Bytes</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Decode</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s, i) => {
          const color = typeColor[s.type] ?? '#f0f0f0'
          const idx = s.slot
          return (
            <tr key={`${dataTestIdPrefix}-${i}`} style={{ background: color }}>
              <td style={{ padding: '8px' }}>{s.slot}</td>
              <td style={{ padding: '8px' }}>{s.name}</td>
              <td style={{ padding: '8px' }}>{s.type}</td>
              <td style={{ padding: '8px' }}>
                {s.bytes} / 32
              </td>
              <td style={{ padding: '8px' }}>
                <input
                  aria-label={`decode-input-${idx}`}
                  placeholder={`hex (64 chars)`}
                  style={{ width: 320, padding: '6px' }}
                  onChange={(e) => onHexChange(idx, e.target.value)}
                />
                <div data-testid={`decoded-${idx}`} style={{ marginTop: 4, fontFamily: 'monospace' }}>
                  {getDecoded(idx, s.type)}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  const rows = layout

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: compare ? '1fr 1fr' : '1fr', gap: 24 }}>
        <section>
          {renderTable(rows, 'layout')}
          <div style={{ marginTop: 12, padding: '8px 0' }}>
            <strong>Packing</strong>: {packingBytesAvailable} bytes potential empty in current layout
          </div>
        </section>
        {compare && (
          <section>
            {renderTable(compare, 'compare')}
          </section>
        )}
      </div>
    </div>
  )
}

export default StorageLayout
