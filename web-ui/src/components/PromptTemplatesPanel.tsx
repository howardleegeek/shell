import React from 'react'
import { SVM_TEMPLATES, EVM_TEMPLATES } from '../promptTemplates'

type Props = {
  onSelect: (prompt: string) => void
  onClose?: () => void
}

const panelWrapper: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid #444',
  background: 'linear-gradient(135deg, #1b1b2b 0%, #1a1a2a 100%)',
}

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 12,
}

const tabBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #444',
  background: '#111',
  color: '#e6e6ff',
  cursor: 'pointer',
}

const tabActive: React.CSSProperties = {
  ...tabBtn,
  background: '#1a1a2a',
  borderColor: '#666',
}

const cardStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid #444',
  background: '#1b1b2b',
  cursor: 'pointer',
}

export default function PromptTemplatesPanel({ onSelect }: Props) {
  const [tab, setTab] = React.useState<'solana'|'evm'>('solana')
  const templates = tab === 'solana' ? SVM_TEMPLATES : EVM_TEMPLATES

  return (
    <div style={panelWrapper}>
      <div style={tabBar} aria-label="template-tabs">
        <button
          style={tab === 'solana' ? tabActive : tabBtn}
          onClick={() => setTab('solana')}
        >
          SVM
        </button>
        <button
          style={tab === 'evm' ? tabActive : tabBtn}
          onClick={() => setTab('evm')}
        >
          EVM
        </button>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}
      >
        {templates.map((t) => (
          <div key={t.id} style={cardStyle} onClick={() => onSelect(t.prompt)}>
            <div style={{ fontSize: 28 }}>{t.emoji}</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{t.title}</div>
            <div style={{ color: '#ddd', fontSize: 12, marginTop: 4 }}>{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
