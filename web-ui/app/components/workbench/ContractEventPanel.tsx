import React, { useEffect, useMemo, useRef, useState } from 'react'

type EvEvent = {
  timestamp: string
  name: string
  address?: string
  args?: any
  txHash?: string
  source?: 'evm' | 'solana'
}

type FilterState = {
  eventName: string
  address: string
  sinceHours: number
}

// Simple, self-contained contract events panel
// - Shows simulated EVM and Solana events
// - Provides basic filtering and export (JSON/CSV)
export default function ContractEventPanel() {
  const [evmEvents, setEvmEvents] = useState<EvEvent[]>([])
  const [solEvents, setSolEvents] = useState<EvEvent[]>([])
  const [filter, setFilter] = useState<FilterState>({ eventName: 'All', address: '', sinceHours: 1 })
  const [live, setLive] = useState<boolean>(true)
  const timerRef = useRef<number | null>(null)

  // Seed with a couple of sample events
  useEffect(() => {
    const t = new Date().toISOString()
    const sample: EvEvent[] = [
      {
        timestamp: t,
        name: 'Transfer',
        address: '0x1a2b...abcd',
        args: { from: '0x1111...aaaa', to: '0x2222...bbbb', value: '1000 USDC' },
        txHash: '0xabcdef123456',
        source: 'evm',
      },
      {
        timestamp: t,
        name: 'Approval',
        address: '0x3c4d...ef01',
        args: { owner: '0x3333...cccc', spender: '0x4444...dddd', value: 'MAX' },
        txHash: '0x1234abcd5678',
        source: 'evm',
      },
    ]
    setEvmEvents(sample)
    const s2: EvEvent[] = [
      {
        timestamp: t,
        name: 'AccountChange',
        address: 'So1anaAcct111',
        args: { balance: 12345 },
        source: 'solana',
      },
    ]
    setSolEvents(s2)
  }, [])

  // Simple live simulator: every 4-8 seconds generate a random event
  useEffect(() => {
    if (!live) return
    const tick = () => {
      const now = new Date().toISOString()
      // Randomly pick event type
      const evName = Math.random() > 0.5 ? 'Transfer' : 'Approval'
      const isTransfer = evName === 'Transfer'
      const e: EvEvent = {
        timestamp: now,
        name: evName,
        address: isTransfer ? '0x5a6b...7c8d' : '0x9e8f...a1b2',
        args: isTransfer
          ? { from: '0x0000...0000', to: '0xdead...beef', value: Math.floor(Math.random() * 1000) + ' token' }
          : { owner: '0x1111...aaaa', spender: '0x2222...bbbb', value: 'MAX' },
        txHash: Math.random().toString(16).slice(2, 10) + 'deadbeef',
        source: 'evm',
      }
      setEvmEvents((prev) => [e, ...prev].slice(0, 200))

      const s: EvEvent = {
        timestamp: now,
        name: 'AccountChange',
        address: 'SoMana' + Math.floor(Math.random() * 1000),
        args: { balance: Math.floor(Math.random() * 100000) },
        source: 'solana',
      }
      setSolEvents((prev) => [s, ...prev].slice(0, 200))
    }
    timerRef.current = window.setInterval(tick, 4000 + Math.random() * 4000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [live])

  // Helpers
  const filteredEvents = useMemo(() => {
    const all = [...evmEvents.map((e) => ({ ...e, source: 'evm' as const })), ...solEvents.map((e) => ({ ...e, source: 'solana' as const }))]
    const byName = filter.eventName === 'All' ? all : all.filter((e) => e.name === filter.eventName)
    const byAddr = filter.address ? byName.filter((e) => (e.address ?? '').toLowerCase().includes(filter.address.toLowerCase())) : byName
    const hours = filter.sinceHours
    // simple time filter; keep events that occurred within last N hours
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).getTime()
    const res = byAddr.filter((e) => {
      const ts = new Date(e.timestamp).getTime()
      return ts >= since
    })
    // sort by timestamp desc
    return res.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [evmEvents, solEvents, filter])

  const exportJSON = () => {
    const payload = {
      evm: evmEvents,
      solana: solEvents,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contract-events.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const all = [...evmEvents.map((e) => ({ ...e, source: 'evm' })), ...solEvents.map((e) => ({ ...e, source: 'solana' }))]
    const header = ['timestamp', 'source', 'name', 'address', 'txHash', 'details']
    const rows = all.map((r) => {
      const details = JSON.stringify(r.args ?? {})
      return [r.timestamp, r.source, r.name, r.address ?? '', r.txHash ?? '', details].join(',')
    })
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contract-events.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setEvmEvents([])
    setSolEvents([])
  }

  // Simple color helper
  const colorFor = (name: string) => {
    if (name === 'Transfer') return '#10b981'
    if (name === 'Approval') return '#3b82f6'
    if (name === 'AccountChange') return '#f87171'
    return '#9ca3af'
  }

  // UI
  return (
    <section className="contract-event-panel" aria-label="Contract Event Panel" style={{ padding: 12 }}>
      <h3 style={{ margin: '0 0 8px 0' }}>Contract Events</h3>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <span>Filter:</span>
        <select
          value={filter.eventName}
          onChange={(e) => setFilter((f) => ({ ...f, eventName: e.target.value }))}
          style={{ padding: '6px 8px' }}
        >
          <option>All</option>
          <option>Transfer</option>
          <option>Approval</option>
          <option>AccountChange</option>
        </select>
        <input
          placeholder="Address filter"
          value={filter.address}
          onChange={(e) => setFilter((f) => ({ ...f, address: e.target.value }))}
          style={{ padding: '6px 8px', minWidth: 180 }}
        />
        <span>Last</span>
        <select
          value={String(filter.sinceHours)}
          onChange={(e) => setFilter((f) => ({ ...f, sinceHours: Number(e.target.value) }))}
          style={{ padding: '6px 8px' }}
        >
          <option value={1}>1h</option>
          <option value={4}>4h</option>
          <option value={12}>12h</option>
          <option value={24}>24h</option>
        </select>
        <button onClick={() => setLive((v) => !v)} style={{ padding: '6px 12px' }}>
          {live ? 'Pause' : 'Resume'} Live
        </button>
        <div style={{ marginLeft: 'auto' }} />
        <button onClick={exportJSON} style={{ padding: '6px 12px' }}>
          Export JSON
        </button>
        <button onClick={exportCSV} style={{ padding: '6px 12px' }}>
          Export CSV
        </button>
        <button onClick={clearAll} style={{ padding: '6px 12px' }}>
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
        <div>
          <strong>EVM</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
          {filteredEvents.map((e, idx) => (
            <div key={`evm-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: colorFor(e.name) }} />
              <span style={{ width: 120, color: '#6b7280' }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{e.name}</span>
              <span style={{ fontFamily: 'monospace', color: '#374151' }}>{e.address ?? ''}</span>
              <span style={{ fontFamily: 'monospace' }}>{e.txHash ?? ''}</span>
              <span style={{ fontFamily: 'monospace' }}>{JSON.stringify(e.args ?? {})}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />

      <div>
        <strong>Solana</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
          {solEvents.map((e, idx) => (
            <div key={`sol-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: colorFor(e.name) }} />
              <span style={{ width: 120, color: '#6b7280' }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{e.name}</span>
              <span style={{ fontFamily: 'monospace' }}>{e.address ?? ''}</span>
              <span style={{ fontFamily: 'monospace' }}>{JSON.stringify(e.args ?? {})}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
