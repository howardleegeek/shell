import React from 'react'

export type TemplateItem = {
  id: string
  name: string
  description: string
  chain: string
  category: string
  icon: string
  promptTemplate: string
}

export const TemplateCard: React.FC<{ template: TemplateItem; onUse: () => void }> = ({ template, onUse }) => {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #0ff',
    borderRadius: 8,
    padding: 12,
    background: '#0c0f14',
    color: '#e6faff',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }
  const iconStyle: React.CSSProperties = { fontSize: 28, alignSelf: 'flex-start' }
  const titleStyle: React.CSSProperties = { fontWeight: 700, fontSize: 14 }
  const descStyle: React.CSSProperties = { fontSize: 12, color: '#cbd5e1' }
  const buttonStyle: React.CSSProperties = {
    marginTop: 6,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #0ff',
    background: 'transparent',
    color: '#0ff',
    cursor: 'pointer',
  }

  return (
    <div style={cardStyle}>
      <div style={iconStyle}>{template.icon}</div>
      <div style={titleStyle}>{template.name}</div>
      <div style={descStyle}>{template.description}</div>
      <button style={buttonStyle} onClick={onUse}>Use</button>
    </div>
  )
}

export default TemplateCard
