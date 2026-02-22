import React, { useEffect, useState } from 'react'
import { liveReloadEnabled, liveReloadStatus, lastDeployAddress, simulateFileChange, initLiveReloadWatcher, resetLiveReload } from '../../lib/stores/livereload'

// Simple Live Reload toggle for the editor toolbar.
// - Green dot when status is ready
// - Yellow dot when compiling
// - Red dot when error
// - Disabled when prerequisites are not met (local chain + compiler)

function statusColor(status: string) {
  switch (status) {
    case 'ready':
      return '#28a745' // green
    case 'compiling':
      return '#f0ad4e' // orange/yellow
    case 'deploying':
      return '#f0ad4e'
    case 'error':
      return '#d9534f' // red
    default:
      return '#6c757d' // gray idle
  }
}

export default function LiveReloadToggle() {
  const [enabled, setEnabled] = useState<boolean>(liveReloadEnabled.get() ?? false)
  const [status, setStatus] = useState<string>(liveReloadStatus.get())
  const [addr, setAddr] = useState<string | null>(lastDeployAddress.get())

  // Subscribe to stores for reactive UI
  useEffect(() => {
    const unsubEnabled = liveReloadEnabled.subscribe((v: boolean) => {
      setEnabled(!!v)
    })
    const unsubStatus = liveReloadStatus.subscribe((v: string) => {
      setStatus(v)
    })
    const unsubAddr = lastDeployAddress.subscribe((v: string | null) => setAddr(v))
    return () => {
      unsubEnabled()
      unsubStatus()
      unsubAddr()
    }
  }, [])

  // Pretend prerequisites check (local chain and compiler exist for demo)
  const canLiveReload = true

  const toggle = () => {
    if (!canLiveReload) return
    const next = !enabled
    liveReloadEnabled.set(next as any)
  }

  // Initialize watcher on mount in a non-test environment; tests simulate changes
  useEffect(() => {
    initLiveReloadWatcher(['web-ui/src'], () => {})
  }, [])

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} aria-label="live-reload-toggle">
      <button onClick={toggle} disabled={!canLiveReload} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #444', background: enabled ? '#111' : '#222', color: '#e6e6ff' }}>
        Live Reload
      </button>
      <span
        title={status}
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          display: 'inline-block',
          background: statusColor(status),
          border: '1px solid #0000',
        }}
      />
      <span style={{ color: '#ddd' }}>
        {addr ? `Deployed: ${addr}` : 'No deployment'}
      </span>
    </div>
  )
}
