import React, { useEffect, useState } from 'react'

// Import stores
// Path from this file: web-ui/app/components/workbench/LiveReloadToggle.tsx
// to livereload.ts: ../../lib/stores/livereload
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { liveReloadEnabled, liveReloadStatus, lastDeployAddress, deployTo } = (() => {
  try {
    // @ts-ignore
    const mods = require('../../lib/stores/livereload')
    return {
      liveReloadEnabled: mods.liveReloadEnabled,
      liveReloadStatus: mods.liveReloadStatus,
      lastDeployAddress: mods.lastDeployAddress,
      deployTo: mods.deployTo,
    }
  } catch {
    return { liveReloadEnabled: null, liveReloadStatus: null, lastDeployAddress: null, deployTo: null }
  }
})()

type Status = 'idle' | 'compiling' | 'deploying' | 'ready' | 'error'

function statusColor(s: Status | null): string {
  switch (s) {
    case 'ready':
      return '#16a34a' // green
    case 'deploying':
    case 'compiling':
      return '#f59e0b' // yellow
    case 'error':
      return '#ef4444' // red
    default:
      return '#10b981' // idle/unknown -> green by default
  }
}

const isLocalChainRunning = true
const isCompilerAvailable = true

const LiveReloadToggle: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [status, setStatus] = useState<Status>('idle')
  const [addr, setAddr] = useState<string>('')

  useEffect(() => {
    // subscribe to stores if available
    if (liveReloadEnabled && liveReloadEnabled.subscribe) {
      const unsub = liveReloadEnabled.subscribe((v: boolean) => setEnabled(!!v))
      // initialize
      setEnabled(!!enabled)
      return unsub
    }
  }, [liveReloadEnabled])

  useEffect(() => {
    if (liveReloadStatus && liveReloadStatus.subscribe) {
      const unsub = liveReloadStatus.subscribe((s: Status) => {
        setStatus(s)
      })
      return unsub
    }
  }, [liveReloadStatus])

  useEffect(() => {
    if (lastDeployAddress && lastDeployAddress.subscribe) {
      const unsub = lastDeployAddress.subscribe((a: string) => {
        setAddr(a)
      })
      return unsub
    }
  }, [lastDeployAddress])

  const toggle = () => {
    if (!isLocalChainRunning || !isCompilerAvailable || !liveReloadEnabled?.set) {
      // Do nothing if preconditions are not met
      return
    }
    // Flip enabled state
    const next = !enabled
    if (liveReloadEnabled?.set) liveReloadEnabled.set(next)
    setEnabled(next)
  }

  // Disable if preconditions not met
  const disabled = !(isLocalChainRunning && isCompilerAvailable)

  return (
    <div className="live-reload-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={toggle} disabled={disabled} aria-label="Live Reload toggle">
        Live Reload {enabled ? 'On' : 'Off'}
      </button>
      <span
        aria-label="Live Reload status"
        style={{ width: 12, height: 12, borderRadius: 6, display: 'inline-block', background: statusColor(status) }}
      />
      {addr ? (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{addr}</span>
      ) : null}
    </div>
  )
}

export default LiveReloadToggle
