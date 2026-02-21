import React from 'react'

export type TemplateItem = {
  id: string
  name: string
  description: string
  icon: string
  promptTemplate: string
  chain?: string
}

interface Props {
  t: TemplateItem
  onUse: (t: TemplateItem) => void
}

// Simple neon-styled template card
export const TemplateCard: React.FC<Props> = ({ t, onUse }) => {
  const cardStyle: React.CSSProperties = {
    border: '2px solid #0ff',
    borderRadius: 12,
    padding: 12,
    width: 260,
    background: '#0b0b12',
    color: '#e6faff',
    boxShadow: '0 0 16px rgba(0,255,255,.4)',
    transition: 'transform .15s',
  }
  const iconStyle: React.CSSProperties = { fontSize: 28, filter: 'drop-shadow(0 0 6px #0ff)' }
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(0,255,255,.25)', marginBottom: 8 }
  const buttonStyle: React.CSSProperties = {
    marginTop: 8,
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#0ff',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 0 6px #0ff',
  }

  return (
    <div data-testid={`template-${t.id}`} style={cardStyle}>
      <div style={headerStyle}>
        <span style={iconStyle}>{t.icon}</span>
        <strong style={{ fontSize: 14 }}>{t.name}</strong>
      </div>
      <div style={{ fontSize: 12, color: '#dbeaff', opacity: 0.9 }}>{t.description}</div>
      <button style={buttonStyle} onClick={() => onUse(t)}>Use</button>
    </div>
  )
}

export default TemplateCard
