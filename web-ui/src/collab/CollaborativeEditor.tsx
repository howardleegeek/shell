import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Presence } from './core'

type Props = {
  filePath: string
  content: string
  onChange?: (newContent: string) => void
}

/**
 * CollaborativeEditor
 * A lightweight in-browser collaboration surface using BroadcastChannel when available.
 * It synchronizes the document content across tabs/windows on the same origin.
 * This is a pragmatic stand-in for a full Yjs-based implementation for the purposes of the repo exercises.
 */
const CollaborativeEditor: React.FC<Props> = ({ filePath, content, onChange }) => {
  const [local, setLocal] = useState<string>(content)
  const [presence, setPresence] = useState<Presence[]>([])
  const clientIdRef = useRef<string>(Math.random().toString(36).slice(2))
  const channelRef = useRef<any | null>(null)
  const initializedRef = useRef<boolean>(false)

  // Sync prop -> local
  useEffect(() => {
    setLocal(content)
  }, [content])

  // Initialize a BroadcastChannel-based synchronization when supported
  useEffect(() => {
    const channelName = `collab-${filePath}`
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new (window as any).BroadcastChannel(channelName)
      channelRef.current = bc
      bc.onmessage = (ev: MessageEvent) => {
        const msg = ev.data
        if (!msg || typeof msg !== 'object') return
        const { type, content: remoteContent, authorId } = msg
        if (type === 'update' && authorId !== clientIdRef.current && typeof remoteContent === 'string') {
          setLocal(remoteContent)
          onChange?.(remoteContent)
        } else if (type === 'presence' && Array.isArray(msg.presence)) {
          // update presence list from remote
          setPresence(msg.presence)
        }
      }
      // announce join
      bc.postMessage({ type: 'presence', presence: [{ id: clientIdRef.current, name: 'You', editing: false, filePath }] })
    }
    initializedRef.current = true
    return () => {
      channelRef.current?.close?.()
      channelRef.current = null
    }
  }, [filePath])

  // Publish local changes to remote peers if channel is available
  useEffect(() => {
    if (!initializedRef.current) return
    const bc = channelRef.current
    if (bc) {
      bc.postMessage({ type: 'update', content: local, authorId: clientIdRef.current })
    }
  }, [local])

  const onLocalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setLocal(v)
    onChange?.(v)
  }

  // Simple, readable UI with inline styles to avoid extra CSS files
  const containerStyle: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 860 }
  const headerStyle: React.CSSProperties = { fontWeight: 600, marginBottom: 6 }
  const textareaStyle: React.CSSProperties = { width: '100%', height: 240, fontFamily: 'ui-monospace,SFMono-Regular,Monaco,Consolas,monospace', fontSize: 14, padding: 8, borderRadius: 6, border: '1px solid #ccc' }
  const presenceStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }
  const presencePill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999, background: '#f0f0f0', fontSize: 12 }

  return (
    <div style={containerStyle} aria-label="collab-editor">
      <div style={headerStyle}>Collaborative Editor — {filePath}</div>
      <textarea value={local} onChange={onLocalChange} style={textareaStyle} data-testid="collab-textarea" />
      <div>
        <strong>Presence</strong>
        <div style={presenceStyle} aria-label="presence-list">
          {presence.length === 0 && <span style={{ color: '#888' }}>No collaborators connected.</span>}
          {presence.map((p) => (
            <span key={p.id} style={presencePill}>{p.name} {p.editing ? '(editing)' : '(idle)'}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CollaborativeEditor
